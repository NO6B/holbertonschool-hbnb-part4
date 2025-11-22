document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const reviewForm = document.getElementById('review-form');

    // initialisation du formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // stopper envoi normal du form
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            await loginUser(email, password);
        });
    }

    // initialisation de la page accueil
    if (document.getElementById('places-list')) {
        checkAuthentication();
        setupPriceFilter();
    }

    // initialisation de la page details
    if (document.getElementById('place-details')) {
        checkAuthentication();
    }

    // gestion de la page pour laisser un avis
    if (reviewForm) {
        // recuperer token et id place
        const token = getCookie('token');
        const placeId = getPlaceIdFromURL(); 
        
        // redirige vers index si pas de token
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // afficher nom de la place
        fetchPlaceTitle(placeId);
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const reviewText = document.getElementById('review').value;
            const ratingValue = document.getElementById('rating').value;
            const ratingNumber = parseInt(ratingValue);

            await submitReview(token, placeId, reviewText, ratingNumber);
        });
    }
});


// fonction pour se connecter
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
            // stocker le token dans le cookie
            document.cookie = `token=${data.access_token}; path=/`;
            window.location.href = 'index.html';
        } else {
            alert('echec de connexion: ' + response.statusText);
        }
    } catch (error) {
        alert('erreur reseau: ' + error.message);
    }
}

// recuperer valeur d'un cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// verifier la connexion et mettre a jour l'affichage
function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-button');

    // afficher ou cacher le bouton login
    if (loginLink) {
        loginLink.style.display = !token ? 'block' : 'none';
    }

    // charger les places si on est sur l'index et connecte
    if (document.getElementById('places-list')) {
        if (token) {
            fetchPlaces(token);
        }
    }

    // gestion du bouton d'ajout d'avis sur la page detail
    if (document.getElementById('place-details')) {
        const placeId = getPlaceIdFromURL();
        const addReviewSection = document.getElementById('add-review');
        
        if (addReviewSection) {
            if (!token) {
                addReviewSection.style.display = 'none'; // cacher si deconnecte
            } else {
                addReviewSection.style.display = 'block'; // afficher si connecte
                // configurer le lien du bouton
                const btn = addReviewSection.querySelector('button');
                if (btn) {
                    btn.onclick = () => window.location.href = `add_review.html?place_id=${placeId}`;
                }
            }
        }
        
        fetchPlaceDetails(token, placeId);
    }
}

// recuperer l'id de la place depuis l'url
function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('place_id');
}


// appel api pour avoir les details d'une place
async function fetchPlaceDetails(token, placeId) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        
        // ajout du token d'autorisation si present
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:5000/api/v1/places/${placeId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const place = await response.json();
            displayPlaceDetails(place);
        } else {
            console.error('echec chargement details:', response.statusText);
        }
    } catch (error) {
        console.error('erreur connexion:', error);
    }
}

// afficher les informations de la place
function displayPlaceDetails(place) {
    const placeDetailsSection = document.getElementById('place-details');
    placeDetailsSection.innerHTML = ''; 
    
    // creer le titre
    const title = document.createElement('h1');
    title.textContent = place.title || place.name;
    title.className = 'place-title';
    placeDetailsSection.appendChild(title);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'place-info';

    // owner
    const host = document.createElement('p');
    host.innerHTML = `<b>host:</b> ${place.owner ? place.owner.first_name + ' ' + place.owner.last_name : 'unknown'}`;

    // prix
    const price = document.createElement('p');
    price.innerHTML = `<b>prix par nuit:</b> $${place.price}`;

    // description
    const description = document.createElement('p');
    description.innerHTML = `<b>description:</b> ${place.description}`;

    // equipements
    const amenities = document.createElement('p');
    let amenitiesText = 'pas d\'equipements';
    if (place.amenities && place.amenities.length > 0) {
        amenitiesText = place.amenities.map(a => a.name || a).join(', ');
    }
    amenities.innerHTML = `<b>equipements:</b> ${amenitiesText}`;

    // ajouter les infos a la section
    infoContainer.appendChild(host);
    infoContainer.appendChild(price);
    infoContainer.appendChild(description);
    infoContainer.appendChild(amenities);
    placeDetailsSection.appendChild(infoContainer);

    // afficher la liste des avis
    const reviewsContainer = document.getElementById('reviews');
    reviewsContainer.innerHTML = '<h3>avis</h3>';
    if (place.reviews && place.reviews.length > 0) {
        place.reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <p><strong>${review.user_name || 'user'}</strong></p>
                <p>${review.text || review.comment || ''}</p>
                <p class="rating">note: ${review.rating}/5</p>
            `;
            reviewsContainer.appendChild(reviewCard);
        });
    } else {
        reviewsContainer.innerHTML += '<p>aucun avis</p>';
    }
}

// recuperer toutes les places via l'api
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
            console.error('echec chargement places:', response.statusText);
        }
    } catch (error) {
        console.error('erreur', error);
    }
}

// creer et afficher les cartes de places
function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = '';

    places.forEach(place => {
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card';
        placeCard.setAttribute('data-price', place.price);

        placeCard.innerHTML = `
            <h2>${place.title}</h2>  
            <p>prix par nuit: $${place.price}</p>  
            <button class="details-button" onclick="location.href='place.html?place_id=${place.id}'">voir details</button>
        `;

        placesList.appendChild(placeCard);
    });
}

// gerer le filtre des prix
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


// recuperer le titre de la place
async function fetchPlaceTitle(placeId) {
    try {
        const response = await fetch(`http://localhost:5000/api/v1/places/${placeId}`);
        if (response.ok) {
            const place = await response.json();
            const idSection = document.getElementById('place-identification');
            if (idSection) {
                idSection.innerHTML = `<h1>avis pour : ${place.title || place.name}</h1>`;
            }
        }
    } catch (error) {
        console.error('erreur', error);
    }
}

// envoyer l'avis a l'api
async function submitReview(token, placeId, reviewText, rating) {
    try {
        const response = await fetch(`http://localhost:5000/api/v1/reviews`, { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                place_id: placeId,
                text: reviewText,
                rating: rating
            })
        });

        if (response.ok) {
            alert('avis ajouté');
            window.location.href = `place.html?place_id=${placeId}`;
        } else {
            alert('echec. statut: ' + response.status);
        }
    } catch (error) {
        alert('erreur reseau: ' + error.message);
    }
}