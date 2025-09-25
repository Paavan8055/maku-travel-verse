import{r,a2 as o}from"./index-sjMrv3Ur-1758787615240.js";const c=()=>(r.useEffect(()=>{(async()=>{try{const{data:e,error:t}=await o.functions.invoke("dynamic-sitemap");if(t){console.error("Failed to fetch sitemap:",t);return}const n=new Response(e,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600"}});document.open(),document.write(e),document.close()}catch(e){console.error("Error generating sitemap:",e);const t=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://maku.travel</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://maku.travel/search</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;document.open(),document.write(t),document.close()}})()},[]),null);export{c as default};
