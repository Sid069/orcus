const newsList = document.getElementById('newsList');

function startTypingAnimation(element) {
  const textToType = element.textContent;
  element.textContent = "";
  element.classList.add('animate');
  const textLength = textToType.length;
  let i = 0;

  function typeLetter() {
    if (i < textLength) {
      element.textContent += textToType.charAt(i);
      i++;
      setTimeout(typeLetter, 50);
    }
  }

  typeLetter();
}

const typingTexts = document.querySelectorAll('.typing-text');
typingTexts.forEach((element) => {
  startTypingAnimation(element);
});

function startButtonAnimation() {
  const button = document.querySelector('.hero-btn');
  button.classList.add('animate');
}

const totalAnimationDuration = typingTexts.length * 500;
setTimeout(startButtonAnimation, totalAnimationDuration);

function handleServiceIntersection(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      observer.unobserve(entry.target); // Unobserve to prevent repeated animations
    }
  });
}

const serviceObserver = new IntersectionObserver(handleServiceIntersection, {
  root: null,
  rootMargin: '0px',
  threshold: 0.2, // Adjust threshold for earlier triggering
});

const services = document.querySelectorAll('.service');
services.forEach((service) => {
  serviceObserver.observe(service);
});

function handleSectionIntersection(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      observer.unobserve(entry.target);
    }
  });
}

const sectionObserver = new IntersectionObserver(handleSectionIntersection, {
  root: null,
  rootMargin: '0px',
  threshold: 0.2, // Adjust threshold for earlier triggering
});

const howItWorksSection = document.querySelector('.how-it-works-section');
sectionObserver.observe(howItWorksSection);

function handleStepIntersection(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      observer.unobserve(entry.target);
    }
  });
}

const stepObserver = new IntersectionObserver(handleStepIntersection, {
  root: null,
  rootMargin: '0px',
  threshold: 0.2, // Adjust threshold for earlier triggering
});

const steps = document.querySelectorAll('.how-it-works-section .step');
steps.forEach((step) => {
  stepObserver.observe(step);
});

// Get all the "Read More" buttons
const expandButtons = document.querySelectorAll('.expand-button');

// Add click event listeners to each "Read More" button
expandButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const expandableContent = button.previousElementSibling;
        if (expandableContent.style.display === 'none' || expandableContent.style.display === '') {
            expandableContent.style.display = 'block';
            button.textContent = 'Read Less';
        } else {
            expandableContent.style.display = 'none';
            button.textContent = 'Read More';
        }
    });
});


// PWA INSTALL 

// const installButton = document.getElementById('installButton');
// let deferredPrompt;

// window.addEventListener('beforeinstallprompt', (event) => {
//   // Prevent the browser's default install prompt
//   event.preventDefault();
//   // Store the event for later use
//   deferredPrompt = event;
//   // Show the custom install button
//   installButton.style.display = 'block';
// });

// installButton.addEventListener('click', () => {
//   // Show the browser's install prompt
//   if (deferredPrompt) {
//     deferredPrompt.prompt();
//     deferredPrompt.userChoice.then((choiceResult) => {
//       if (choiceResult.outcome === 'accepted') {
//         console.log('User accepted the installation');
//       } else {
//         console.log('User dismissed the installation');
//       }
//       // Reset the deferredPrompt variable
//       deferredPrompt = null;
//       // Hide the custom install button
//       installButton.style.display = 'none';
//     });
//   }
// });


axios
  .post('/login') // Example login data
  .then((response) => {
    const notifications = response.data;

    // Update the newsList UL with notifications and anchor tags
    const listItems = notifications.map((notification) => {
      return `<li><a href="${notification.link}">${notification.news}</a></li><li><hr class="dropdown-divider"></li>`;
    });

    newsList.innerHTML = listItems.join(' ');
  })
  .catch((error) => {
    console.error('Error during login:', error);
  });
