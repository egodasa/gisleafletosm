//START OF DATA
    var lokasi_saya = null,interval_lokasi_saya = null,koordinat_lokasi_saya = null;
    //daftar penyedia peta
    var mapbox = {
        key: 'pk.eyJ1IjoiZWdvZGFzYSIsImEiOiJjamd4NWkyMmwwNms2MnhsamJvaWQ3NGZmIn0.6ok1IiPZ0sPNXmiIe-iEWA',
        id: ['mapbox.streets','mapbox.satellite']
    }
    var hereMaps = {
        app_id: 'E17xLy684GUEuKvqCWjC',
        app_code: 'xOGYvX2MLBLm7HDvzJ4E7Q',
        variant: ['normal.day','hybrid.day']
    }
    var bingMaps = {
        BingMapsKey: 'Amblsqmvthuv21W0xJTYBSk_Vpd8i4w_yovkDX6K8mVb-UlgkypA5uCGXiHel0rd',
        imagerySet: ['Road','AerialWithLabels'],
        culture: 'id'
    }
    
    //defenisi posisi dan zoom peta
    var posisi = [-0.942942, 100.371857];
    var zoom = 13;
    
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
    
    //variabel penampung list poligon dalam bentuk geojson
    var listPolygon = [];
    
    //variabel penampung option dari setiap layer poligon
    var optionPoligon = {
        onEachFeature: function(feature, layer) {
            layer.on("click", function(e){
                currentId = layer
            })
            layer.bindTooltip("<p>" + feature.properties.message + "</p>")
        },
        style: function(feature){
            return feature.properties.style
        }
    }
    
    //variabel penampung list poligon dalam bentuk geojson
    var layerPoligon = L.geoJSON(null, optionPoligon);
    
    //variabel yang berisi berbagai macam layer dari berbagai penyedia layanan peta
    var OpenStreetMap = L.tileLayer.provider('OpenStreetMap');
    
    //variabel penampung peta
    var mymap = L.map('mapid', {layers: [OpenStreetMap, layerPoligon]}).setView(posisi, zoom);
    
    //variabel untuk penampung daftar layer yang bisa dipakai termasuk layer poligon
    var penyediaPeta = {
        "OpenStreetMap": OpenStreetMap,
        "Mapbox Streets": L.tileLayer.provider('MapBox', {id: mapbox.id[0], accessToken: mapbox.key}),
        "Mapbox Satelite": L.tileLayer.provider('MapBox', {id: mapbox.id[1], accessToken: mapbox.key}),
        "Bing Streets": L.tileLayer.bing({BingMapsKey: bingMaps.BingMapsKey, imagerySet: bingMaps.imagerySet[0], culture: bingMaps.culture}),
        "Bing Satelite": L.tileLayer.bing({BingMapsKey: bingMaps.BingMapsKey, imagerySet: bingMaps.imagerySet[1], culture: bingMaps.culture}),
        "HERE Streets": L.tileLayer.provider('HERE.terrainDay', {app_id: hereMaps.app_id, app_code: hereMaps.app_code}),
        "HERE Satellite": L.tileLayer.provider('HERE.hybridDay', {app_id: hereMaps.app_id, app_code: hereMaps.app_code})
    }
    var penyediaPoligon = {
        "Daftar Poligon": layerPoligon
    }
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
    function initMap(){
        L.control.layers(penyediaPeta, penyediaPoligon).addTo(mymap);
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
        layerPoligon.clearLayers();
        this.mymap.closePopup();
        el("listPolygon").innerHTML = showTable(tableHead, listPolygon);
        tampilkanDaftarPolygon();
    }
    //looping listpoligon dan di add ke layerpoligon untuk ditampilkan ke peta
    function tampilkanDaftarPolygon(){
        if(listPolygon.length != 0){
            layerPoligon.addData(turf.featureCollection(toGeoJSON(listPolygon, "marker", "prop")));
            mymap.fitBounds(layerPoligon.getBounds());
        }
    }
    //method untuk menterjemahkan data js ke geojson
    function toGeoJSON(list, cordinate_name, prop_name){
        var listGeoJson = [];
        for(var x = 0; x < list.length; x++){
            listGeoJson.push(turf.polygon([list[x][cordinate_name]], listPolygon[x][prop_name]));
        }
        return listGeoJson;
    }
    function addPolygon(x){
        var y = [];
        for(var z = 0; z < x[0].length; z++){
            y.push([x[0][z].lng, x[0][z].lat])
        }
        y.push(y[0]);
        listPolygon.push({
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
        layerPoligon.clearLayers();
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
        //hapus salah satu geojson dari variabel dan dilooping ulang di metod refreshMap()
        listPolygon.splice(x,1);
        refreshMap();
    }
    function gantiPosisiPeta(){
        if(koordinat_lokasi_saya === null)
        {
            alert("Lokasi belum ditemukan. Silahkan klik tombol 'LOKASI SAYA'...")
        }
        else
        {
            mymap.setView(koordinat_lokasi_saya, zoom);
        }
    }
    function callbackGetLokasiBerhasil(position)
    {
        // jika koordinat sekarang masih sama dengan yang sebelumnya, jangan update peta atau marker lokasi saya
        if(koordinat_lokasi_saya === null || (koordinat_lokasi_saya[0] != position.coords.latitude && koordinat_lokasi_saya[1] != position.coords.longitude))
        {
            koordinat_lokasi_saya = [position.coords.latitude, position.coords.longitude];
            posisi = [position.coords.latitude, position.coords.longitude]
            el('lat').value = position.coords.latitude;
            el('lng').value = position.coords.longitude;
            if(marker_lokasi_saya)
            {
                marker_lokasi_saya.setLatLng(koordinat_lokasi_saya);
            }
            else
            {
                marker_lokasi_saya = L.marker(koordinat_lokasi_saya).addTo(mymap);
                console.log('Posisi inisialisasi');
                mymap.setView(koordinat_lokasi_saya, zoom)
            }
            setLokasiRealtime();
        }
    }
    function callbackGetLokasiGagal(error)
    {
        var pesan = "Silahkan muat ulang halaman ini...";
        var pesan_error = "";
        switch(error.code) {
        case error.PERMISSION_DENIED:
          pesan_error = "Akses ke GPS gagal.";
          break;
        case error.POSITION_UNAVAILABLE:
          pesan_error = "Lokasi tidak tersedia.";
          break;
        case error.TIMEOUT:
          pesan_error = "Gagal mengambil lokasi.";
          break;
        case error.UNKNOWN_ERROR:
          pesan_error = "GPS error.";
          break;
      }
        matikanLokasi();
        alert(pesan_error + pesan);
    }

    // fungsi untuk menemukan lokasi dengan gps. Hanya sekali eksekusi/tidak realtime.
    function getLokasi() {
        // lokasi ditemukan
        if (navigator.geolocation)
        {
            navigator.geolocation.getCurrentPosition(callbackGetLokasiBerhasil, callbackGetLokasiGagal);
        }
        else
        {
            alert("Perangkat/browser Anda tidak mendukung deteksi lokasi dengan GPS. Silahkan ganti perangkat/browser Anda ke perangkat yang didukung...");
        }
    }

    // fungsi untuk cek status lokasi gps
    function lokasiTersedia()
    {
        return koordinat_lokasi_saya !== null;
    }
 
    // temukan lokasi user secara realtime setiap 5 detik menggunakan set interval
    function setLokasiRealtime()
    {
        // set realtime lokasi jika belum di set
        if(!interval_lokasi_saya)
        {
            interval_lokasi_saya = setInterval(getLokasi, "5000");
        }   
    }
    function matikanLokasi()
    {
        if(interval_lokasi_saya)
        {
            clearInterval(interval_lokasi_saya);
            if(marker_lokasi_saya)
            {
                marker_lokasi_saya.remove();
                marker_lokasi_saya = null;
                koordinat_lokasi_saya = null
            }
        }
    }
    //EOF METHOD
    
    //START OF PROGRAM
    initMap();
    refreshMap();
    getLokasi();
