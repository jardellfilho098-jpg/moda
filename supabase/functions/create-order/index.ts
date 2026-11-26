// Edge Function demonstrativa para pedidos sem pagamento, sujeita a testes antes de produção.
// Configure verify_jwt=false para aceitar visitantes anônimos; nunca expor a secret key no browser.
// Em produção aplique rate-limit, captcha, bloqueio de abuso e monitoramento de tentativas.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const cors={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
 'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
Deno.serve(async(request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(request.method!=='POST')return reply(405,{error:'Método inválido'});
 try{
  const input=await request.json();
  const customer=String(input.customer||'').trim().slice(0,100);
  const phone=String(input.phone||'').replace(/\D/g,'');
  const fulfillment=input.fulfillment==='retirada'?'retirada':'entrega';
  const address=String(input.address||'').trim().slice(0,250);
  const notes=String(input.notes||'').trim().slice(0,250);
  const lineItems=input.items;
  if(customer.length<3||phone.length<10||phone.length>15||fulfillment==='entrega'&&!address)return reply(400,{error:'Dados do cliente inválidos'});
  if(!Array.isArray(lineItems)||!lineItems.length||lineItems.length>30)return reply(400,{error:'Itens inválidos'});
  const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const url=Deno.env.get('SUPABASE_URL');
  if(!url||!secret)return reply(503,{error:'Serviço ainda não configurado'});
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const ids=[...new Set(lineItems.map((v:Record<string,unknown>)=>String(v.productId||'')))];
  const {data:products,error:productsError}=await db.from('products').select('id,active,data').in('id',ids);
  if(productsError)throw productsError;
  const details=[] as {productId:string;name:string;image:string;size:string;color:string;price:number;quantity:number}[];
  let subtotal=0;
  for(const item of lineItems){
    const qty=Number(item.quantity);
    if(!Number.isInteger(qty)||qty<1||qty>99)return reply(400,{error:'Quantidade inválida'});
    const row=products?.find(p=>p.id===String(item.productId));
    if(!row||!row.active)return reply(400,{error:'Produto não disponível'});
    const p=row.data as {name:string;price:number;images:string[];variants:{id:string;size:string;color:string;stock:number}[]};
    const variant=p.variants.find(v=>v.id===String(item.variantId));
    if(!variant||variant.stock<qty)return reply(409,{error:'Estoque indisponível para uma das peças'});
    const price=Number(p.price);
    if(!Number.isFinite(price)||price<0)return reply(400,{error:'Preço inválido'});
    details.push({productId:row.id,name:String(p.name).slice(0,100),image:String(p.images?.[0]||''),size:variant.size,color:variant.color,price,quantity:qty});
    subtotal+=qty*price;
  }
  const {data:settings}=await db.from('store_settings').select('data').eq('id',1).maybeSingle();
  const config=settings?.data as {name?:string;whatsapp?:string;deliveryFee?:number;delivery?:boolean;pickup?:boolean}|undefined;
  if(fulfillment==='entrega'&&config?.delivery===false||fulfillment==='retirada'&&config?.pickup===false)return reply(400,{error:'Modalidade indisponível'});
  const freight=fulfillment==='entrega'?Math.max(0,Number(config?.deliveryFee)||0):0;
  const total=Math.round((subtotal+freight)*100)/100;
  const orderNumber='DM-'+crypto.randomUUID().split('-')[0].toUpperCase();
  const {data:order,error:orderError}=await db.from('orders').insert({order_number:orderNumber,customer_name:customer,customer_phone:phone,fulfillment,address,notes,items:details,total,status:'aguardando_confirmacao'}).select('id,order_number').single();
  if(orderError)throw orderError;
  const number=String(config?.whatsapp||'').replace(/\D/g,'');
  const message=['Olá! Gostaria de solicitar um pedido na '+(config?.name||'loja'),'Pedido: '+orderNumber,'Cliente: '+customer,'','Itens:',...details.map(i=>'- '+i.name+' ('+i.size+', '+i.color+') x'+i.quantity+' — '+money(i.price*i.quantity)),'','Total: '+money(total),'Recebimento: '+(fulfillment==='entrega'?'Entrega':'Retirada'),address?'Endereço: '+address:'',notes?'Observações: '+notes:'','Aguardo a confirmação da loja.'].filter(Boolean).join('\n');
  return reply(200,{id:order.id,order_number:orderNumber,total,whatsapp_url:/^\d{12,15}$/.test(number)?'https://wa.me/'+number+'?text='+encodeURIComponent(message):null});
 }catch(e){console.error('Order creation failed',e);return reply(500,{error:'Não foi possível registrar o pedido'})}
});
