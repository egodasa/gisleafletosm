import 'w3-css';
import 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.pm';
import 'leaflet.pm/dist/leaflet.pm.css';
import 'leaflet-providers';
import 'leaflet-bing-layer';
import 'turf-jsts';
import 'promise-polyfill/src/polyfill';
//START OF DATA
    var posisi = [-0.942942, 100.371857];
    var zoom = 13;
    
    //variabel penampung peta
    var mymap = L.map('mapid').setView(posisi, zoom);
    
    //variabel penampung pengaturan control yang ingin dimunculkan
    var options = {
        position: 'topleft', // toolbar position, options are 'topleft', 'topright', 'bottomleft', 'bottomright'
        drawMarker: false, // adds button to draw markers
        drawPolyline: false, // adds button to draw a polyline
        drawRectangle: true, // adds button to draw a rectangle
        drawPolygon: true, // adds button to draw a polygon
        drawCircle: false, // adds button to draw a cricle
        cutPolygon: false, // adds button to cut a hole in a polygon
        editMode: false, // adds button to toggle edit mode for all layers
        removalMode: false, // adds a button to remove layers
    };
    //variabel style awal poligon
    var defaultStyle = {
            fillColor: '#800026',
            weight: 2,
            opacity: 1,
            color: "white",
            dashArray: '3',
            fillOpacity: 0.7
        };
        
    //variabel penampung list poligon
    var listMarker = [];
    
    //variabel penampung list poligon dalam bentuk geojson
    var geoJSON = null;
    
    //Setiap layer baru, di masukkan ke variabel ini agar bisa dihapus jika batal membuat polygon
    var currentLayerJSON = null;
    var currentId = null;
    
    //Defenisi tabel poligon
    var tableHead = [
    {
        name: "_no",
        caption: "No",
        format: function(x){ 
            return x+1;
            }
    },
    {
        name: "prop",
        caption: "Isi Pesan",
        format: function(x){ 
            return x.message;
            }
    },
    {
        name: "prop",
        caption: "Warna Poligon",
        format: function(x){ 
            return "<div style='width: 100px; height: 25px; background-color: " + x.style.fillColor + "; border: 5px dashed " + x.style.color +";'></div>";
            }
    },
    {
        name: "_aksi",
        caption: "Aksi",
        format: function(x){ 
            return "<button type='button' class='w3-btn w3-red' onclick='deletePolygon(" + x + ")'>Hapus</button>";
            }
    }];
    // EOF DATA
    
    //START OF METHOD
    function el(x){
        return document.getElementById(x);
    }
    function showHasilGeoJSON(){
        if(geoJSON) el("hasilGeoJSON").value = JSON.stringify(geoJSON.toGeoJSON());
        else el("hasilGeoJSON").value = null;
    }
    function initMap(peta = 'OpenStreetMap'){
        //Token mapbox : pk.eyJ1IjoiZWdvZGFzYSIsImEiOiJjamd4NWkyMmwwNms2MnhsamJvaWQ3NGZmIn0.6ok1IiPZ0sPNXmiIe-iEWA
        switch(peta){
            case 'Mapbox Streets' : 
                L.tileLayer.provider('MapBox', {
                    id: 'mapbox.streets',
                    accessToken: 'pk.eyJ1IjoiZWdvZGFzYSIsImEiOiJjamd4NWkyMmwwNms2MnhsamJvaWQ3NGZmIn0.6ok1IiPZ0sPNXmiIe-iEWA'
                }).addTo(mymap);
            break;
            case 'Mapbox Satellite' : 
                L.tileLayer.provider('MapBox', {
                    id: 'mapbox.satellite',
                    accessToken: 'pk.eyJ1IjoiZWdvZGFzYSIsImEiOiJjamd4NWkyMmwwNms2MnhsamJvaWQ3NGZmIn0.6ok1IiPZ0sPNXmiIe-iEWA'
                }).addTo(mymap);
            break;
            case 'Bing Maps Streets' : 
                L.tileLayer.bing({BingMapsKey: 'Amblsqmvthuv21W0xJTYBSk_Vpd8i4w_yovkDX6K8mVb-UlgkypA5uCGXiHel0rd',imagerySet: 'Road',culture: 'id'}).addTo(mymap)
            break;
            case 'Bing Maps Satellite' : 
                L.tileLayer.bing({BingMapsKey: 'Amblsqmvthuv21W0xJTYBSk_Vpd8i4w_yovkDX6K8mVb-UlgkypA5uCGXiHel0rd',imagerySet: 'AerialWithLabels',culture: 'id'}).addTo(mymap)
            break;
            case 'HERE Maps' : 
                L.tileLayer.provider('HERE.terrainDay', {
                    app_id: 'E17xLy684GUEuKvqCWjC',
                    app_code: 'xOGYvX2MLBLm7HDvzJ4E7Q'
                }).addTo(mymap);
            break;
            case 'OpenStreetMap' :
            default : 
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
                    id: 'mapid'
                }).addTo(mymap);
        }
        //map event
        mymap.on('moveend', function(e){
            posisi = [mymap.getCenter().lat, mymap.getCenter().lng]
            zoom = mymap.getZoom()
            el('lat').value = posisi[0]
            el('lng').value = posisi[1]
        });
        //add map controlls
        mymap.pm.addControls(options);
        
        //map event
        mymap.on('pm:create', function(e){
            //layer dimasukkan ke variabel agar bisa dihapus
            currentLayerJSON = e;
            
            //Menampilkan popup untuk layer baru
            e.layer.bindPopup(getPopUp(e.layer._latlngs), {className: "w3-panel"}).openPopup();
        });
    };
    function refreshMap(){
        if(currentLayerJSON) {
            currentLayerJSON.layer.remove();
        }
        if(geoJSON){
            geoJSON.clearLayers();
        }
        mymap.closePopup();
        el("listMarker").innerHTML = showTable(tableHead, listMarker);
        showGeoJSON();
    }
    function showGeoJSON(){
        if(listMarker.length != 0){
            geoJSON = L.geoJSON(turf.featureCollection(toGeoJSON(listMarker, "marker", "prop")), {
                onEachFeature: function(feature, layer) {
                    layer.on("click", function(e){
                        currentId = layer
                    })
                    layer.bindTooltip("<p>" + feature.properties.message + "</p>")
                },
                style: function(feature){
                    return feature.properties.style
                }
            }).addTo(mymap)
            mymap.fitBounds(geoJSON.getBounds());
            showHasilGeoJSON();
        }
    }
    function toGeoJSON(list, cordinate_name, prop_name){
        var listGeoJson = [];
        for(var x = 0; x < list.length; x++){
            listGeoJson.push(turf.polygon([list[x][cordinate_name]], listMarker[x][prop_name]));
        }
        return listGeoJson;
    }
    function addPolygon(x){
        var y = [];
        for(var z = 0; z < x[0].length; z++){
            y.push([x[0][z].lng, x[0][z].lat])
        }
        y.push(y[0]);
        listMarker.push({
            marker: y,
            prop: {
                    message: el("message").value,
                    style: {
                        fillColor: el("fillColor").value || defaultStyle.fillColor,
                        weight: el("weight").value || defaultStyle.weight,
                        opacity: 1,
                        color: el("color").value || defaultStyle.color,
                        dashArray: el("dashArray").value || defaultStyle.dashArray,
                        fillOpacity: el("fillOpacity").value || defaultStyle.fillOpacity
                    }
                }
            }
        );
        refreshMap();
    };
    function getPopUp(x){
        x = JSON.stringify(x)
        return "<div style='width:200px; height: 150px; overflow-x:hidden; overflow-y:scroll;  '><p><label>Warna Isian</label> <input class='w3-input w3-border' type='color' id='fillColor' /></p>" +
            "<p><label>Warna Pembatas</label> <input class='w3-input w3-border' type='color' id='color' /></p>" +
            "<p><label>Besar Strip Pembatas</label> <input class='w3-input w3-border' type='number' id='dashArray'  min='0' max='10' /></p>" +
            "<p><label>Ketebalan Pembatas</label> <input class='w3-input w3-border' type='number' id='weight' min='0' max='10' /></p>" +
            "<p><label>Besar Transparant</label> <input class='w3-input w3-border' type='number' id='fillOpacity' step='0.1' min='0' max='1' /></p>" +
            "<p><label>Isi Pesan</label> <textarea class='w3-input w3-border' id='message'></textarea></p>" +
            "<button type='button' class='w3-btn w3-teal' onclick='addPolygon("+x+");'>Terapkan</button>" +
            "<button type='button' class='w3-btn w3-red' onclick='currentLayerJSON.layer.remove(); refreshMap();'>Batal</button></div>";
    };
    function removeGeoJSON(){
        geoJSON.clearLayers();
    }
    function showTable(head, data){
        var thead = "", tbody = "";
        thead += "<thead><tr class='w3-teal'>";
        for(var x = 0; x < head.length; x++){
            thead += "<th>" + head[x].caption + "</th>";
        }
        thead += "</thead></tr>";
        tbody += "<tbody>";
        if(data.length != 0){
            for(var x = 0; x < data.length; x++){
                tbody += "<tr>";
                for(var y = 0; y < head.length; y++){
                    if(head[y].name[0] == "_"){
                        tbody += "<td>" + head[y].format(x) + "</td>";
                    }else{
                        if(head[y].format){
                            tbody += "<td>" + head[y].format(data[x][head[y].name]) + "</td>";
                        }else tbody += "<td>" + data[x][head[y].name] + "</td>";
                    }
                }
                tbody += "</tr>";
            }
        }else{
            tbody += "<tr><td class='w3-center' colspan='" + head.length+1 + "'><b>Data Kosong</b></td></tr>"
        }
        tbody += "</tbody>";
        return thead + tbody;
    }
    function deletePolygon(x){
        listMarker.splice(x,1);
        refreshMap();
    }
    function importGeoJSON(){
        if(el("hasilGeoJSON").value){
            geoJSON = L.geoJSON(JSON.parse(el("hasilGeoJSON").value), {
                onEachFeature: function(feature, layer) {
                    layer.on("click", function(e){
                        currentId = layer
                    })
                    layer.bindTooltip("<p>" + feature.properties.message + "</p>")
                },
                style: function(feature){
                    return feature.properties.style
                }
            }).addTo(mymap)
            mymap.fitBounds(geoJSON.getBounds());
            showHasilGeoJSON();
        } 
    }
    function gantiPeta(peta){
        mymap.remove();
        initMap(peta);
        refreshMap();
    }
    function gantiPosisiPeta(){
        posisi = [el('lat').value, el('lng').value];
        mymap.setView(posisi, zoom);
    }
    function getLokasi() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position){
                posisi = [position.coords.latitude, position.coords.longitude]
                el('lat').value = position.coords.latitude;
                el('lng').value = position.coords.longitude;
                mymap.setView(posisi, zoom)
            });
        }else{
            el('lat').value = posisi[0]
            el('lng').value = posisi[1]
        }
    }
    //EOF METHOD
    
    //START OF PROGRAM
    initMap();
    refreshMap();
    getLokasi();
