/* CivicConnect location module
   Uses Leaflet + Esri World Street Map tiles (no API key required).
   Nominatim is used only for India location search/reverse-geocoding.
*/
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_BOUNDS = [[6.4627, 68.1097], [35.5133, 97.3956]];

function loadLeaflet(){
  if(window.L) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const existing=document.getElementById("leafletJS");
    if(existing){
      existing.addEventListener("load",resolve,{once:true});
      existing.addEventListener("error",reject,{once:true});
      return;
    }
    if(!document.getElementById("leafletCSS")){
      const css=document.createElement("link");
      css.id="leafletCSS"; css.rel="stylesheet";
      css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    const script=document.createElement("script");
    script.id="leafletJS";
    script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload=resolve; script.onerror=()=>reject(new Error("Leaflet could not be loaded"));
    document.head.appendChild(script);
  });
}

async function geocodeIndia(query){
  const q=(query||"").trim();
  if(!q) return null;
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&addressdetails=1&q=${encodeURIComponent(q)}`;
  try{
    const r=await fetch(url,{headers:{"Accept-Language":"en-IN,en;q=0.9"}});
    if(!r.ok) throw new Error("Geocoder unavailable");
    const data=await r.json();
    const item=data.find(x=>String(x?.address?.country_code||"").toLowerCase()==="in") || data[0];
    if(!item) return null;
    return {lat:Number(item.lat),lon:Number(item.lon),display:item.display_name};
  }catch(e){
    return null;
  }
}

async function reverseGeocodeIndia(lat,lon){
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,{headers:{"Accept-Language":"en-IN,en;q=0.9"}});
    if(!r.ok) throw new Error("Reverse geocoder unavailable");
    const d=await r.json();
    if(String(d?.address?.country_code||"").toLowerCase()!=="in") return null;
    return d?.display_name?{display:d.display_name}:null;
  }catch(e){
    return null;
  }
}

function indiaMap(containerId, options={}){
  const el=document.getElementById(containerId);
  if(!el) return Promise.resolve(null);
  return loadLeaflet().then(()=>{
    // Reuse an existing map if this function is called more than once.
    if(el._civicMap) return el._civicMap;
    const map=L.map(el,{scrollWheelZoom:true,minZoom:4,maxZoom:19,zoomControl:true}).setView(options.center||INDIA_CENTER,options.zoom||5);

    // Esri's public World Street Map is used instead of the OSM volunteer tile
    // server, which can reject embedded/demo applications with HTTP 403.
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",{
      maxZoom:19,
      attribution:'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), TomTom, MapmyIndia, OpenStreetMap contributors, and the GIS User Community'
    }).addTo(map);
    map.setMaxBounds(INDIA_BOUNDS);
    map.setMinZoom(4);
    el._civicMap=map;
    setTimeout(()=>map.invalidateSize(),100);
    return map;
  });
}

function addMapMarker(map,lat,lon,label){
  if(!map || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
  const marker=L.marker([Number(lat),Number(lon)]).addTo(map);
  if(label) marker.bindPopup(`<strong>${escapeHTML(label)}</strong>`).openPopup();
  return marker;
}

function isIndiaCoordinate(lat,lon){
  return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=6.46&&lat<=35.52&&lon>=68.10&&lon<=97.40;
}

async function setupCitizenLocationMap(){
  const mapEl=document.getElementById("locationMap");
  if(!mapEl) return;
  const status=document.getElementById("locationStatus");
  const latEl=document.getElementById("latitude");
  const lonEl=document.getElementById("longitude");
  const locEl=document.getElementById("manualLocation");

  let map;
  try{
    map=await indiaMap("locationMap",{center:INDIA_CENTER,zoom:5});
  }catch(e){
    status.textContent="Map could not load — use search or GPS";
    status.className="pill warning";
    return;
  }
  let marker=null;

  const setPoint=(lat,lon,label,zoom=15)=>{
    lat=Number(lat); lon=Number(lon);
    if(!isIndiaCoordinate(lat,lon)){
      status.textContent="Please select a location in India";
      status.className="pill warning";
      return false;
    }
    latEl.value=lat.toFixed(6);
    lonEl.value=lon.toFixed(6);
    if(marker) marker.remove();
    marker=addMapMarker(map,lat,lon,label||"Selected location");
    map.setView([lat,lon],zoom);
    status.textContent="Location selected";
    status.className="pill success";
    return true;
  };

  map.on("click",e=>setPoint(e.latlng.lat,e.latlng.lng,"Selected location"));

  const gpsBtn=document.getElementById("gpsBtn");
  if(gpsBtn){
    gpsBtn.onclick=null;
    gpsBtn.addEventListener("click",()=>{
      if(!navigator.geolocation){
        status.textContent="GPS unavailable — search or click the map";
        status.className="pill warning";
        return;
      }
      status.textContent="Detecting current location…";
      status.className="pill info";
      navigator.geolocation.getCurrentPosition(async pos=>{
        const lat=pos.coords.latitude,lon=pos.coords.longitude;
        if(!isIndiaCoordinate(lat,lon)){
          status.textContent="Current GPS location is outside India";
          status.className="pill warning";
          return;
        }
        const place=await reverseGeocodeIndia(lat,lon);
        locEl.value=place?.display||"Current location, India";
        setPoint(lat,lon,locEl.value,16);
      },err=>{
        status.textContent=err?.code===1?"Location permission denied — search or click the map":"GPS unavailable — search or click the map";
        status.className="pill warning";
      },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
    });
  }

  document.getElementById("locationSearchBtn")?.addEventListener("click",async()=>{
    const q=locEl.value.trim();
    if(!q){status.textContent="Enter an Indian place to search";status.className="pill warning";return;}
    status.textContent="Searching real Indian locations…";
    status.className="pill info";
    const result=await geocodeIndia(q);
    if(!result){
      status.textContent="Location not found. Try a city, road, landmark or PIN code.";
      status.className="pill warning";
      return;
    }
    locEl.value=result.display;
    setPoint(result.lat,result.lon,result.display,15);
  });

  locEl?.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();
      document.getElementById("locationSearchBtn")?.click();
    }
  });

  // Let users edit coordinates manually and press Enter/tab out to reposition.
  [latEl,lonEl].forEach(input=>input?.addEventListener("change",()=>{
    const lat=Number(latEl.value),lon=Number(lonEl.value);
    if(isIndiaCoordinate(lat,lon)) setPoint(lat,lon,locEl.value||"Selected location",15);
  }));

  mapEl._civicMap=map;
}

async function setupAdminLocationMap(c){
  const mapEl=document.getElementById("adminLocationMap");
  if(!mapEl) return;
  const lat=Number(c?.latitude),lon=Number(c?.longitude);
  const hasCoords=isIndiaCoordinate(lat,lon);
  let map;
  try{
    map=await indiaMap("adminLocationMap",{center:hasCoords?[lat,lon]:INDIA_CENTER,zoom:hasCoords?16:5});
  }catch(e){
    mapEl.innerHTML='<div class="location-map-fallback">Map could not load. Location: '+escapeHTML(c?.location||"Not available")+'</div>';
    return;
  }
  if(hasCoords){
    addMapMarker(map,lat,lon,c.location||"Complaint location");
    map.setView([lat,lon],16);
  }else if(c?.location){
    const result=await geocodeIndia(c.location);
    if(result){
      addMapMarker(map,result.lat,result.lon,result.display);
      map.setView([result.lat,result.lon],15);
    }
  }
  setTimeout(()=>map.invalidateSize(),150);
}
