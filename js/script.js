window.addEventListener('load', () => {
  fetch('https://raw.githubusercontent.com/sachicodex/database/refs/heads/main/edu.json')
    .then(res => res.json())
    .then(images => {
      const grid = document.getElementById('imageGrid');

      images.forEach((imgData) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('card');

        const link = document.createElement('a');
        link.href = imgData.link;
        link.target = '_blank';

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const skeleton = document.createElement('div');
        skeleton.classList.add('skeleton');
        imageContainer.appendChild(skeleton);

        const img = document.createElement('img');
        img.src = imgData.src;
        img.alt = imgData.alt;
        img.style.visibility = 'hidden';
        img.style.opacity = '0';

        img.onload = () => {
          skeleton.remove();
          img.style.visibility = 'visible';
          img.style.opacity = '1';
          img.classList.add('fade-in');
        };

        imageContainer.appendChild(img);
        link.appendChild(imageContainer);

        const title = document.createElement('div');
        title.classList.add('image-title');
        title.textContent = imgData.title;

        link.appendChild(title);
        wrapper.appendChild(link);
        grid.appendChild(wrapper);
      });
    })
    .catch(err => console.error("Error loading images:", err));
});
