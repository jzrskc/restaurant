import axios from 'axios';

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 10
};

// google.map je importan u layouts.pug
// 0. Start - saljemo cijeli div.map
makeMap( document.querySelector('#map') );

// 2. Step - load
function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      // console.log(places);
      if (!places.length) {
        alert('no places found!')
        return;
      }

      // create a bounds - zoom the map to fit all the markers perfectly
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();


      // create markers for Stores from DB in a range 10km
      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      // when someone clicks on a marker, show the details of that place
      markers.forEach(marker => marker.addListener('click', function() {
        console.log(this.place);
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      // then zoom the map to fit all the markers perfectly
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);

    });
};

// 1. Step Display Map
function makeMap(mapDiv) {
  if(!mapDiv) return;
  // console.log(mapDiv);

  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions); // map created
  loadPlaces(map);

  // google Autocomplete
  const input = document.querySelector('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });

};


// navigator.geolocation.getCurrentPosition - Locirati usera (JS30, lesson 21)
export default makeMap;
