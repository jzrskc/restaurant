import axios from 'axios';

const heartForms = document.querySelectorAll('form.heart');
heartForms.addEventListener('submit', ajaxHeart);

/* Ajax Post - srca i broj srca se updejta, bez refresha stranice */


function ajaxHeart(e) {
  e.preventDefault();
  // zabranimo da se forma submita, i mi cemo submitat
  console.log('HEART ITTT!!!!!!!!!!!!!!!!');
  console.log(this); // forma na koju kliknemo
  axios
    .post(this.action)
    .then(res => {
      // console.log(res.data);
      // this.heart - .heart se odnosi na name="heart", tj na button
      const isHearted = this.heart.classList.toggle('heart__button--hearted');
      // console.log(isHearted);
      document.querySelector('.heart-count').textContent = res.data.hearts.length;
      // animacija _heart.scss
      if (isHearted) {
        this.heart.classList.add('heart__button--float');
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
      }
    })
    .catch(console.error);
}

export default ajaxHeart;
