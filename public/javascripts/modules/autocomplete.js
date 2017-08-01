const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);


// const address = document.querySelector('#address');
const address = $('#address');
const lat = document.querySelector('#lat');
const lng = document.querySelector('#lng');

autocomplete(address, lat, lng);

function autocomplete(input, latInput, lngInput) {
  if(!input) return; // skip this fn from running if there is not input on the page

  // ovo je od google, izbacit ce prijedloge gradova cim pocnemo pisati u
  // document.querySelector('#address')
  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });
  // if someone hits enter on the address field, don't submit the form
  input.addEventListener('keydown', (e) => {
    // e.keyCode === 13 === enter
    if (e.keyCode === 13) e.preventDefault();
  });
}

export default autocomplete;
