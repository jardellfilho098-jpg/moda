export type Category='Vestidos'|'Blusas'|'Calças'|'Conjuntos'|'Acessórios';
export type Variant={id:string;size:string;color:string;stock:number};
export type Product={id:string;name:string;description:string;price:number;compareAt?:number;category:Category;images:string[];variants:Variant[];featured?:boolean;newArrival?:boolean;active:boolean;createdAt:string};
export type Banner={id:string;title:string;subtitle:string;image:string;button:string;link:string;active:boolean;sort:number};
export type Settings={name:string;tagline:string;whatsapp:string;instagram:string;address:string;hours:string;delivery:boolean;pickup:boolean;deliveryFee:number};
export type OrderStatus='aguardando_confirmacao'|'confirmado'|'em_separacao'|'pronto_retirada'|'saiu_entrega'|'concluido'|'cancelado';
export type CartItem={key:string;productId:string;variantId:string;quantity:number};
export type Order={id:string;number:string;customer:string;phone:string;fulfillment:'entrega'|'retirada';address:string;notes:string;items:{productId:string;name:string;image:string;size:string;color:string;price:number;quantity:number}[];total:number;status:OrderStatus;createdAt:string};
export const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const settingsSeed:Settings={name:'Dina Moda',tagline:'Moda & Estilo',whatsapp:'',instagram:'',address:'Endereço a definir',hours:'Atendimento sob consulta',delivery:true,pickup:true,deliveryFee:0};
export const bannersSeed:Banner[]=[
{id:'b1',title:'Seu estilo,\nsua essência.',subtitle:'Peças escolhidas para acompanhar cada momento.',image:'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1600',button:'Explorar coleção',link:'#colecao',active:true,sort:0},
{id:'b2',title:'Novidades que\ninspiram.',subtitle:'Uma nova seleção de peças para renovar seus looks.',image:'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1600',button:'Ver novidades',link:'#colecao',active:true,sort:1},
{id:'b3',title:'A beleza dos\ndetalhes.',subtitle:'Elegância, conforto e personalidade em cada escolha.',image:'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=1600',button:'Conhecer peças',link:'#colecao',active:true,sort:2}
];
const img=(id:string)=>`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=850`;
function variants(id:string):Variant[]{return ['P','M','G'].map((size,i)=>({id:id+'-'+size,size,color:'Padrão',stock:[5,8,3][i]}))}
export const productsSeed:Product[]=[
{id:'p1',name:'Vestido Midi Elegante',description:'Vestido midi versátil com caimento refinado, ideal para diferentes ocasiões.',price:149.9,category:'Vestidos',images:[img('1488463')],variants:variants('p1'),featured:true,active:true,createdAt:'2026-10-10'},
{id:'p2',name:'Conjunto Alfaiataria',description:'Conjunto com acabamento sofisticado e silhueta contemporânea.',price:259.9,category:'Conjuntos',images:[img('1536619')],variants:variants('p2'),newArrival:true,active:true,createdAt:'2026-10-16'},
{id:'p3',name:'Blusa Clássica',description:'Blusa leve que combina com composições casuais e formais.',price:129.9,category:'Blusas',images:[img('1488463')],variants:variants('p3'),active:true,createdAt:'2026-10-12'},
{id:'p4',name:'Calça Jeans Reta',description:'Jeans de corte reto para um visual contemporâneo e confortável.',price:179.9,category:'Calças',images:[img('1598507')],variants:variants('p4'),newArrival:true,active:true,createdAt:'2026-10-18'},
{id:'p5',name:'Vestido Casual Bege',description:'Vestido leve com detalhes delicados para o dia a dia.',price:189.9,category:'Vestidos',images:[img('1183266')],variants:variants('p5'),active:true,createdAt:'2026-10-14'},
{id:'p6',name:'Blazer Essencial',description:'Peça coringa para criar looks elegantes e atemporais.',price:229.9,category:'Conjuntos',images:[img('1536619')],variants:variants('p6'),active:true,createdAt:'2026-10-11'},
{id:'p7',name:'Blusa Texturizada',description:'Textura sutil, visual delicado e modelagem confortável.',price:109.9,category:'Blusas',images:[img('1488463')],variants:variants('p7'),active:true,createdAt:'2026-10-13'},
{id:'p8',name:'Bolsa Minimalista',description:'Acessório prático com acabamento clean.',price:119.9,category:'Acessórios',images:[img('1152077')],variants:[{id:'p8-unico',size:'Único',color:'Padrão',stock:7}],active:true,createdAt:'2026-10-08'}
];
export const categories:Category[]=['Vestidos','Blusas','Calças','Conjuntos','Acessórios'];
export const statuses:Record<OrderStatus,string>={aguardando_confirmacao:'Aguardando confirmação',confirmado:'Confirmado',em_separacao:'Em separação',pronto_retirada:'Pronto para retirada',saiu_entrega:'Saiu para entrega',concluido:'Concluído',cancelado:'Cancelado'};
export function validWhatsapp(value:string){return /^\d{12,15}$/.test(value.replace(/\D/g,''))}
