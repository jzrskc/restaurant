import axios from 'axios';
import dompurify from 'dompurify';  // DOM-only, na ovaj nacin stitimo, ako recimo neko ubaci <img> u naslov i stavi alert,
// ostane samo cisti <img>. korisno kod searcha, pa stavimo na HTML koji zelimo prikazati
// '<svg><g/onload=alert(2)//<p>'); // becomes <svg><g></g></svg>

// 0. Start - saljemo cijeli div.search
typeAhead( document.querySelector('.search') );


function searchResultsHTML(stores) {
  return stores.map(store => {
    return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `;
  }).join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.addEventListener('input', function() {
    // console.log(this.value); // print svako nase slovo

    // if there is no value, quit it!
    if (!this.value) {
      searchResults.style.display = 'none';
      return; // stop!
    }

    // show the search results! U pocetku je Hidden
    searchResults.style.display = 'block';

    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        // console.log(res.data);
        if (res.data.length) {
          // console.log('There is something to show!');
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
          return;
        }
        // tell them nothing came back
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value}</div>`);
      })
      .catch(err => {
        console.error(err);
      });
  });

  // handle keyboard inputs. up(38), down(40) i enter(13) mozemo koristiti kod rezultata
  searchInput.addEventListener('keyup', (e) => {
    // if we aren't pressing up, down or enter, skip it!
    if (![38, 40, 13].includes(e.keyCode)) {
      return; // skip it!
    }

    const activeClass = 'search__result--active'; // tamnija bg za active
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result'); // svi rezultati
    let next;
    // if press down
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    }
    // if press down prvi put, dok jos nema current
    else if (e.keyCode === 40) {
      next = items[0];
    }
    // if press up
    else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1]
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    }
    // if press enter
    else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }

    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });

} // end typeAhead fn

export default typeAhead;
