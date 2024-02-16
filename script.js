// Variable globale pour les enregistrements de la grille
var records = [];

// Fonction pour initialiser la grille avec les données JSON
function initialiserGrille(data) {
    // Calculez la hauteur de la grille en fonction du nombre de lignes de données
    var gridHeight = 30 * data.length + 50;
    
    // Définir la hauteur minimale de la grille dans le CSS
    $('#grid').css('min-height', gridHeight + 'px');

    // Initialiser la grille avec les données JSON
    $('#grid').w2grid({
        name: 'grid',
        columns: [
            { field: 'nom', caption: 'Nom', size: '150px' },
            { field: 'facade', caption: 'Façade', size: '100px' },
            { field: 'latitude', caption: 'Latitude', size: '100px' },
            { field: 'longitude', caption: 'Longitude', size: '100px' },
            { field: 'date_visite_previsionnelle', caption: 'Date de visite prévisionnelle', size: '150px' },
            { field: 'date_visite_reelle', caption: 'Date de visite réelle', size: '150px' },
            { field: 'responsable', caption: 'Responsable', size: '150px' },
            { field: 'statut', caption: 'Statut', size: '200px' }
        ],
        records: data
    });

    // Ajouter un gestionnaire d'événements pour écouter la sélection d'une ligne dans la grille
    w2ui['grid'].on('select', function(event) {
        var selectedRecord = event.recid;
        // Récupérer le nom du sémaphore sélectionné dans la grille
        var selectedSemaphore = data[selectedRecord - 1];
        // Vérifier si le nom du sémaphore est valide
        if (selectedSemaphore && selectedSemaphore.nom) {
            // Rechercher le marqueur correspondant sur la carte par le nom du sémaphore
            var marker = findMarkerByName(selectedSemaphore.nom);
            // Si un marqueur correspondant est trouvé, centrer la carte sur ce marqueur
            if (marker) {
                map.setView(marker.getLatLng(), map.getZoom() || 12);
                marker.openPopup();
            }
        }
    });
}

// Variable globale pour la carte
var map;
// On crée un dictionnaire pour stocker les marqueurs de la carte
var markerDictionary = {};

// Fonction pour initialiser la carte Leaflet avec les données existantes
function initialiserCarte(data) {
    // Vérifier si la carte n'est pas déjà initialisée
    if (!map) {
        map = L.map('map').setView([48.2566, -4.3522], 8); // Brest, France comme position initiale
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map); // On ajoute un style de carte OpenStreetMap
    }

    // Ajouter les marqueurs pour chaque sémaphore
    data.forEach(function(semaphore) {
        if (semaphore.latitude && semaphore.longitude) {
            var latitude = parseFloat(semaphore.latitude);
            var longitude = parseFloat(semaphore.longitude);
            if (!isNaN(latitude) && !isNaN(longitude)) {
                var couleurIcone = semaphore.statut === 'Visité récemment' ? 'blue' : 'orange';
                var customIcon = L.icon({
                    iconUrl: 'images/marker-icon-' + couleurIcone + '.svg', // Les icones changent de couleur en fonction de si ils sont visités récement ou non
                    iconSize: [35, 51],
                    iconAnchor: [12, 41],
                    popupAnchor: [6, -34]
                });
                var popupContent = '<b>Nom:</b> ' + semaphore.nom + '<br>' +
                                '<b>État:</b> ' + semaphore.statut + '<br>' +
                                '<b>Responsable:</b> ' + semaphore.responsable + '<br>' +
                                '<b>Coordonnées du responsable:</b> ' + semaphore.coordonnees_responsable + '<br>' +
                                '<b>Description:</b> ' + semaphore.description;
                // Créer le marqueur et le lier à la carte avec le contenu du popup
                var marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map)
                    .bindPopup(popupContent);

                // Ajouter le marqueur au dictionnaire
                markerDictionary[semaphore.nom] = marker;
            }
        }
    });
}

// Fonction pour trier les sémaphores par date de visite
function trierParDate() {
    w2ui['grid'].sort('date_visite_reelle');
}

var formCounter = 0; // Variable pour générer des noms de formulaire uniques

// Fonction pour ouvrir une popup pour ajouter un sémaphore
function ouvrirPopup() {
    var formName = 'form' + formCounter;
    formCounter++;
    
    $().w2popup({
        title: 'Ajouter un sémaphore',
        body: '<div id="' + formName + '" class="popup-container">' +
        '<div class="popup-row">' +
        '<input name="facade" class="popup-field" placeholder="Façade">' +
        '<input name="nom" class="popup-field" placeholder="Nom">' +
        '</div>' +
        '<div class="popup-row">' +
        '<input name="latitude" class="popup-field" placeholder="Latitude">' +
        '<input name="longitude" class="popup-field" placeholder="Longitude">' +
        '</div>' +
        '<div class="popup-row">' +
        '<input name="date_visite_previsionnelle" class="popup-field" placeholder="Date de visite prévisionnelle">' +
        '<input name="date_visite_reelle" class="popup-field" placeholder="Date de visite réelle">' +
        '</div>' +
        '<div class="popup-row">' +
        '<input name="responsable" class="popup-field" placeholder="Responsable">' +
        '<input name="coordonnees_responsable" class="popup-field" placeholder="Coordonnées du responsable">' +
        '</div>' +
        '<div class="popup-row">' +
        '<textarea name="description" class="popup-field" placeholder="Description du sémaphore"></textarea>' +
        '</div>' +
        '<div class="checkbox-container">' +
        '<input name="statut" type="checkbox" class="popup-field" value="Visite récente">' +
        '<label for="statut">Visite récente</label>' +
        '</div>' +
        '</div>',
        buttons: '<button class="btn" onclick="sauvegarder(\'' + formName + '\')">Sauvegarder</button> <button class="btn" onclick="w2popup.close()">Annuler</button>',
        width: 500,
        height: 350,
        showMax: true
    });
    
    // Creer un formulaire dans la popup
    $('#' + formName).w2form({
        name: formName,
        fields: [
            { name: 'facade', type: 'list', options: { items: ['Atlantique', 'Manche', 'Méditerranée'], openOnFocus: true }, required: true },
            { name: 'nom', type: 'text', required: true },
            { name: 'latitude', type: 'text', required: true },
            { name: 'longitude', type: 'text', required: true },
            { name: 'date_visite_previsionnelle', type: 'date', options: { format: 'yyyy-mm-dd' }, required: true },
            { name: 'date_visite_reelle', type: 'date', options: { format: 'yyyy-mm-dd' }, required: true },
            { name: 'responsable', type: 'text', required: true },
            { name: 'coordonnees_responsable', type: 'text', required: true },
            { name: 'description', type: 'text', required: true },
            { name: 'statut', type: 'checkbox', checked: false, required: true }
        ],
        style: 'border: 0px !important; padding: 5px 10px !important;'
    });
    // Réinitialiser la bordure des champs lorsque l'utilisateur commence à saisir
    $('.popup-field').on('click', function() {
        $(this).css('border', '1px solid #ccc'); // Réinitialiser la bordure à la couleur par défaut
    });
    // Réinitialiser la bordure des champs de liste déroulante lorsque la sélection change
    // ne fonctionne pas pour le moment, a fixer plus tard
    $('.popup-field[type="list"]').on('click', function() {
        $(this).css('border', '1px solid #ccc'); 
    });
}

// Fonction pour sauvegarder les informations saisies dans la popup
function sauvegarder(formName) {
    var form = w2ui[formName];
    var formData = $.extend(true, {}, form.record);
    
    // Validation des champs obligatoires
    // TODO : utiliser une boucle pour simplifier le code
    if (!formData.facade || !formData.nom || !formData.latitude || !formData.longitude || !formData.date_visite_previsionnelle || !formData.date_visite_reelle || !formData.responsable || !formData.coordonnees_responsable || !formData.description) {
        // Affichage d'une alerte à l'utilisateur
        alert("Veuillez remplir tous les champs obligatoires.");
        // Mise en surbrillance des champs manquants en rouge
        if (!formData.facade) $('#facade').css('border', '1px solid red');
        if (!formData.nom) $('#nom').css('border', '1px solid red');
        if (!formData.latitude) $('#latitude').css('border', '1px solid red');
        if (!formData.longitude) $('#longitude').css('border', '1px solid red');
        if (!formData.date_visite_previsionnelle) $('#date_visite_previsionnelle').css('border', '1px solid red');
        if (!formData.date_visite_reelle) $('#date_visite_reelle').css('border', '1px solid red');
        if (!formData.responsable) $('#responsable').css('border', '1px solid red');
        if (!formData.coordonnees_responsable) $('#coordonnees_responsable').css('border', '1px solid red');
        if (!formData.description) $('#description').css('border', '1px solid red');
        return;
    }
    
    // Convertir la valeur de la façade en chaîne de caractères
    formData.facade = formData.facade.text;
    // Convertir la valeur du statut en chaîne de caractères
    formData.statut = formData.statut ? 'Visité récemment' : 'Visité il y a longtemps';
    // Récupérer les valeurs de latitude et de longitude depuis les champs de texte
    var latitude = parseFloat(formData.latitude);
    var longitude = parseFloat(formData.longitude);
    // Vérifier si les valeurs de latitude et de longitude sont valides
    if (!isNaN(latitude) && !isNaN(longitude)) {
        var couleurIcone = formData.statut === 'Visité récemment' ? 'blue' : 'orange'; // Les icones changent de couleur en fonction de si ils sont visités récement ou non
        var customIcon = L.icon({
            iconUrl: 'images/marker-icon-' + couleurIcone + '.svg',
            iconSize: [35, 51],
            iconAnchor: [12, 41],
            popupAnchor: [6, -34]
        });
        var popupContent = '<b>Nom:</b> ' + formData.nom + '<br>' +
        '<b>État:</b> ' + formData.statut + '<br>' +
        '<b>Responsable:</b> ' + formData.responsable + '<br>' +
        '<b>Coordonnées du responsable:</b> ' + formData.coordonnees_responsable + '<br>' +
        '<b>Description:</b> ' + formData.description;
        
        // Récupérer le nombre d'elements dans la liste
        var numberOfRecords = records.length;
        
        // Ajouter le nouveau sémaphore aux enregistrements de la grille
        formData.recid = numberOfRecords + 1; // Utiliser le nombre d'enregistrements existants + 1 comme nouvel identifiant
        records.push(formData);
        w2ui['grid'].add(formData);
        w2ui['grid'].refresh();
        
        // Ajouter le marqueur sur la carte avec le nom du sémaphore en tant que contenu du popup
        var marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map)
        .bindPopup(popupContent);
        
        // Ajouter le marqueur au dictionnaire
        markerDictionary[formData.nom] = marker;
        
        // Centrer la carte sur le nouveau marqueur
        map.setView([latitude, longitude], 12);
        
        // Fermer la popup après avoir ajouté le marqueur
        form.clear();
        w2popup.close();
    } else {
        alert("Veuillez saisir des valeurs valides pour la latitude et la longitude.");
        return;
    }
}

// Fonction pour trouver le marqueur correspondant sur la carte par le nom du sémaphore
function findMarkerByName(semaphoreName) {
    return markerDictionary[semaphoreName] || null;
}


// Fonction pour charger les données depuis le fichier JSON et initialiser la grille
function chargerDonnees() {
    // Charger les données depuis le fichier JSON externe
    $.getJSON('donnees.json', function(data) {
        // Initialiser records avec les données JSON
        records = data;
        // Mettre à jour le recid le plus élevé
        var maxRecid = Math.max(...records.map(record => record.recid));
        // Définir la longueur de records en fonction du recid le plus élevé
        records.length = maxRecid;
        // Initialiser la grille avec les données JSON
        initialiserGrille(records);
        // Initialiser la carte avec les données JSON
        initialiserCarte(records);
        // Trier les sémaphores par date de visite
        trierParDate();
    });
}

$(document).ready(function() {
    chargerDonnees();
});