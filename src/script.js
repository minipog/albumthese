document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main')
  let lightbox = null
  let allLinks = []

  main.addEventListener('click', (event) => {
    const link = event.target.closest('.gallery-item a')
    if (!link) return

    event.preventDefault()

    if (allLinks.length === 0) {
      allLinks = Array.from(document.querySelectorAll('.gallery-item a'))
    }

    const imageUrl = link.getAttribute('href')
    const altText = link.querySelector('img').getAttribute('alt')

    if (!lightbox) {
      lightbox = document.createElement('div')
      lightbox.id = 'lightbox'

      lightbox.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:1000;display:flex;justify-content:center;align-items:center;'

      lightbox.innerHTML =
        '<img id="lightbox-img" style="max-width:90%;max-height:90%;box-shadow:0 0 20px rgba(0,0,0,0.5);">' +
        '<div id="lightbox-prev" style="position:absolute;left:0;top:0;bottom:0;width:10%;display:flex;align-items:center;justify-content:center;font-size:3rem;color:white;opacity:0.6;user-select:none;cursor:pointer;">&#10094;</div>' +
        '<div id="lightbox-next" style="position:absolute;right:0;top:0;bottom:0;width:10%;display:flex;align-items:center;justify-content:center;font-size:3rem;color:white;opacity:0.6;user-select:none;cursor:pointer;">&#10095;</div>'

      lightbox.onclick = (e) => {
        // Only close if clicking the lightbox background itself
        if (e.target.id === 'lightbox') {
          closeLightbox()
        }
      }

      document.body.appendChild(lightbox)

      document.getElementById('lightbox-prev').onclick = (e) => {
        e.stopPropagation()
        navigateLightbox(-1)
      }

      document.getElementById('lightbox-next').onclick = (e) => {
        e.stopPropagation()
        navigateLightbox(1)
      }
    }

    // Set the current image source and open the lightbox
    setLightboxImage(imageUrl, altText)
    lightbox.style.display = 'flex'
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  })

  function closeLightbox() {
    if (lightbox) {
      lightbox.style.display = 'none'
      document.body.style.overflow = 'auto'
    }
  }

  function setLightboxImage(url, alt) {
    const lightboxImg = document.getElementById('lightbox-img')
    if (lightboxImg) {
      lightboxImg.src = url
      lightboxImg.alt = alt
    }
  }

  function navigateLightbox(direction) {
    const lightboxImg = document.getElementById('lightbox-img')
    if (!lightboxImg) return

    const currentUrl = lightboxImg.src
    let currentIndex = -1

    // Find the index of the currently displayed image
    currentIndex = allLinks.findIndex((link) => link.href === currentUrl)

    if (currentIndex === -1) return // Should not happen if logic is correct

    // Calculate the new index, wrapping around the array
    let newIndex =
      (currentIndex + direction + allLinks.length) % allLinks.length

    const newLink = allLinks[newIndex]

    setLightboxImage(
      newLink.getAttribute('href'),
      newLink.querySelector('img').getAttribute('alt')
    )
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.style.display === 'flex') {
      closeLightbox()
      return
    }

    if (lightbox && lightbox.style.display === 'flex') {
      if (e.key === 'ArrowLeft') {
        navigateLightbox(-1)
      } else if (e.key === 'ArrowRight') {
        navigateLightbox(1)
      }
    }
  })
})
