document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            await loginUser(email, password);
        });
    }

    //Vérifier l’authentification sur la page d’index
    if (document.getElementById('places-list')) {
        checkAuthentication();
        setupPriceFilter();
    }
});

//Fonction pour connecter l'utilisateur
async function loginUser(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            document.cookie = `token=${data.access_token}; path=/`;
            window.location.href = 'index.html';
        } else {
            alert('Login failed: ' + response.statusText);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}


/**
 * Fonction pour récupérer un cookie par son nom
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

/**
 * Vérifier l'authentification de l'utilisateur
 */
function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-button');

    if (!token) {
        loginLink.style.display = 'block';
    } else {
        loginLink.style.display = 'none';
        fetchPlaces(token);
    }
}

/**
 * Récupérer la liste des places depuis l'API
 */
async function fetchPlaces(token) {
    try {
        const response = await fetch('http://localhost:5000/api/v1/places', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const places = await response.json();
            displayPlaces(places);
        } else {
            console.error('Failed to fetch places:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching places:', error);
    }
}

//Afficher la liste des places
function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = ''; // Vider le contenu actuel

    places.forEach(place => {
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card';
        placeCard.setAttribute('data-price', place.price);

        placeCard.innerHTML = `
            <h2>${place.title}</h2>  
            <p>Price per night: $${place.price}</p>  
            <button class="details-button" onclick="location.href='place.html?place_id=${place.id}'">View Details</button>
        `;

        placesList.appendChild(placeCard);
    });
}

//Configurer le filtre de prix
function setupPriceFilter() {
    const priceFilter = document.getElementById('price-filter');
    
    priceFilter.addEventListener('change', (event) => {
        const selectedPrice = event.target.value;
        const placeCards = document.querySelectorAll('.place-card');

        placeCards.forEach(card => {
            const price = parseFloat(card.getAttribute('data-price'));

            if (selectedPrice === 'All') {
                card.style.display = 'flex';
            } else {
                const maxPrice = parseFloat(selectedPrice);
                if (price <= maxPrice) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
}


