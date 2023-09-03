const newsList = document.getElementById('newsList');


axios.post('/login') // Example login data
  .then(response => {
    const notifications = response.data;

    // Update the newsList UL with notifications and anchor tags
    const listItems = notifications.map(notification => {
      return `<li><a href="${notification.link}">${notification.news}</a></li><li><hr class="dropdown-divider"></li>`;
    });

    newsList.innerHTML = listItems.join(' ');
  })
  .catch(error => {
    console.error('Error during login:', error);
  });