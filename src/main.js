import 'w3-css';
import 'leaflet';
import 'leaflet.pm';
import 'leaflet-providers';
import 'leaflet-bing-layer';
import 'leaflet/dist/leaflet.css';
import 'leaflet.pm/dist/leaflet.pm.css';
import 'turf-jsts';
import 'promise-polyfill/src/polyfill';

class Peta{
    Constructor(id, posisi, zoom){
        this.posisi = posisi;
        this.zoom = zoom;
        this.mymap = L.map(id).setView(posisi, zoom);
        //variabel penampung pengaturan control yang ingin dimunculkan
        this.options = {
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
        this.defaultStyle = {
                fillColor: '#800026',
                weight: 2,
                opacity: 1,
                color: "white",
                dashArray: '3',
                fillOpacity: 0.7
            };
            
        //variabel penampung list poligon
        this.listMarker = [];
        
        //variabel penampung list poligon dalam bentuk geojson
        this.geoJSON = null;
        
        //Setiap layer baru, di masukkan ke variabel ini agar bisa dihapus jika batal membuat polygon
        this.currentLayerJSON = null;
        this.currentId = null;
        
        //Defenisi tabel poligon
        this.tableHead = [
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
    }
    el(x){
        return document.getElementById(x);
    }
    showTable(head, data){
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
    initMap(peta = 'OpenStreetMap'){
        //Token mapbox : pk.eyJ1IjoiZWdvZGFzYSIsImEiOiJjamd4NWkyMmwwNms2MnhsamJvaWQ3NGZmIn0.6ok1IiPZ0sPNXmiIe-iEWA
        switch(peta){
            case 'Mapbox Streets' : 
                L.tileLayer.provider('MapBox', {
                    id: 'mapbox.streets',
                    accessToken: 'pk.eyJ1IjoiZWdvZGFzYSIsImEiOiJjamd4NWkyMmwwNms2MnhsamJvaWQ3NGZmIn0.6ok1IiPZ0sPNXmiIe-iEWA'
                }).addTo(this.mymap);
            break;
            case 'Mapbox Satellite' : 
                L.tileLayer.provider('MapBox', {
                    id: 'mapbox.satellite',
                    accessToken: 'pk.eyJ1IjoiZWdvZGFzYSIsImEiOiJjamd4NWkyMmwwNms2MnhsamJvaWQ3NGZmIn0.6ok1IiPZ0sPNXmiIe-iEWA'
                }).addTo(this.mymap);
            break;
            case 'Bing Maps Streets' : 
                L.tileLayer.bing({BingMapsKey: 'Amblsqmvthuv21W0xJTYBSk_Vpd8i4w_yovkDX6K8mVb-UlgkypA5uCGXiHel0rd',imagerySet: 'Road',culture: 'id'}).addTo(this.mymap)
            break;
            case 'Bing Maps Satellite' : 
                L.tileLayer.bing({BingMapsKey: 'Amblsqmvthuv21W0xJTYBSk_Vpd8i4w_yovkDX6K8mVb-UlgkypA5uCGXiHel0rd',imagerySet: 'AerialWithLabels',culture: 'id'}).addTo(this.mymap)
            break;
            case 'HERE Maps' : 
                L.tileLayer.provider('HERE.terrainDay', {
                    app_id: 'E17xLy684GUEuKvqCWjC',
                    app_code: 'xOGYvX2MLBLm7HDvzJ4E7Q'
                }).addTo(this.mymap);
            break;
            case 'OpenStreetMap' :
            default : 
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
                    id: 'mapid'
                }).addTo(this.mymap);
        }
        //map event
        this.mymap.on('moveend', (e)=>{
            this.posisi = [this.mymap.getCenter().lat, this.mymap.getCenter().lng]
            this.zoom = this.mymap.getZoom()
            this.el('lat').value = this.posisi[0]
            this.el('lng').value = this.posisi[1]
        });
        //add map controlls
        this.mymap.pm.addControls(this.options);
        
        //map event
        this.mymap.on('pm:create', (e)=>{
            //layer dimasukkan ke variabel agar bisa dihapus
            this.currentLayerJSON = e;
            
            //Menampilkan popup untuk layer baru
            e.layer.bindPopup(getPopUp(e.layer._latlngs), {className: "w3-panel"}).openPopup();
            this.el("Badd_polygon").addEventListener('click',addPolygon(e.layer._latlngs));
            this.el("Bcancel_add_polygon").addEventListener('click',()=>{
                this.currentLayerJSON.layer.remove();
                this.refreshMap();
            });
        });
    }
    refreshMap(){
        if(this.currentLayerJSON) {
            this.currentLayerJSON.layer.remove();
        }
        if(this.geoJSON){
            this.geoJSON.clearLayers();
        }
        this.mymap.closePopup();
        this.el("listMarker").innerHTML = this.showTable(this.tableHead, this.listMarker);
    }
    addPolygon(x){
        var y = [];
        for(var z = 0; z < x[0].length; z++){
            y.push([x[0][z].lng, x[0][z].lat])
        }
        y.push(y[0]);
        this.listMarker.push({
            marker: y,
            prop: {
                    message: this.el("message").value,
                    style: {
                        fillColor: this.el("fillColor").value || this.defaultStyle.fillColor,
                        weight: this.el("weight").value || this.defaultStyle.weight,
                        opacity: 1,
                        color: this.el("color").value || this.defaultStyle.color,
                        dashArray: this.el("dashArray").value || this.defaultStyle.dashArray,
                        fillOpacity: this.el("fillOpacity").value || this.defaultStyle.fillOpacity
                    }
                }
            }
        );
        this.refreshMap();
    };
    getPopUp(x){
        x = JSON.stringify(x)
        return `<div style='width:200px; height: 150px; overflow-x:hidden; overflow-y:scroll;  '><p><label>Warna Isian</label> <input class='w3-input w3-border' type='color' id='fillColor' /></p>
            <p><label>Warna Pembatas</label> <input class='w3-input w3-border' type='color' id='color' /></p>
            <p><label>Besar Strip Pembatas</label> <input class='w3-input w3-border' type='number' id='dashArray'  min='0' max='10' /></p>
            <p><label>Ketebalan Pembatas</label> <input class='w3-input w3-border' type='number' id='weight' min='0' max='10' /></p>
            <p><label>Besar Transparant</label> <input class='w3-input w3-border' type='number' id='fillOpacity' step='0.1' min='0' max='1' /></p>
            <p><label>Isi Pesan</label> <textarea class='w3-input w3-border' id='message'></textarea></p>
            <button type='button' class='w3-btn w3-teal' id='Badd_polygon'>Terapkan</button>
            <button type='button' class='w3-btn w3-red' id='Bcancel_add_polygon'>Batal</button></div>`;
    }
    removeGeoJSON(){
        this.geoJSON.clearLayers();
    }
    deletePolygon(x){
        this.listMarker.splice(x,1);
        this.refreshMap();
    }
    gantiPeta(petas){
        this.mymap.remove();
        this.initMap(petas);
        this.refreshMap();
    }
    gantiPosisiPeta(){
        this.posisi = [this.el('lat').value, this.el('lng').value];
        this.mymap.setView(this.posisi, this.zoom);
    }
    getLokasi() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position)=>{
                this.posisi = [position.coords.latitude, position.coords.longitude]
                this.el('lat').value = position.coords.latitude;
                this.el('lng').value = position.coords.longitude;
                this.mymap.setView(this.posisi, this.zoom)
            });
        }else{
            this.el('lat').value = this.posisi[0]
            this.el('lng').value = this.posisi[1]
        }
    }
}
    //START OF PROGRAM
    var peta = new Peta('mapid', [-0.9240575, 100.3782143], 13);
    peta.initMap();
    peta.refreshMap();
    peta.getLokasi();
    
    //event listener
    peta.el("Cpilih_peta").addEventListener("change", peta.gantiPeta(peta.el("Cpilih_peta").options[peta.el("Cpilih_peta").selectedIndex].value));
    peta.el("Bganti_peta").addEventListener("click", peta.gantiPosisiPeta());
