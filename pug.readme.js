h2#header Hello
  p.text How are you?

- const upDog = dog.toUpperCase();
p.hello Hello my name is #{dog.toUpperCase()}
img(src="dog.jpg", alt=`${dog}`)
a(href="http://", target="_blank") link


extend layout

block content
  p #{title}
  p= title


// If
if locals.flashes

// Foer Each
- const choices = ['Wifi', 'Open Late', 'Family Friendly', 'Vegatarian', 'Licensed']
ul.tags
  each choice in choices
    .tag.tag__choice
      input(type="checkbox" id=choice value=choice name="tags")
      label(for=choice) #{choice}
input(type="submit" value="Save →" class="button")

// loop with index
each store, i in stores
