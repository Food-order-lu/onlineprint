// onlineprint.lu - Main JavaScript

// Panier - Compteur simple (localStorage)
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.querySelector('.cart-count');
    if (countElement) {
        countElement.textContent = `(${cartCount})`;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();

    // Gestion du formulaire de recherche
    const searchForm = document.querySelector('.search-bar form');
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            const searchInput = this.querySelector('.search-input');
            if (!searchInput.value.trim()) {
                e.preventDefault();
                alert('Veuillez entrer un terme de recherche');
            }
        });
    }
});

// Ajouter au panier (fonction utilitaire)
function addToCart(productId, productName, price, quantity = 1) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Message de confirmation
    alert(`${productName} ajouté au panier!`);
}
