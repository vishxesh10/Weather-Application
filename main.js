const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const errorDiv = document.getElementById('error');
const suggestionsContainer = document.getElementById('suggestions-container');

const cityName = document.getElementById('city-name');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');

let selectedSuggestionIndex = -1;
let suggestions = [];

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fetch city suggestions
async function fetchSuggestions(query) {
    if (query.length < 2) {
        suggestionsContainer.classList.remove('active');
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/search.json?key=${API_KEY}&q=${query}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        const data = await response.json();
        suggestions = data;
        
        displaySuggestions(data.slice(0, 5)); // Show top 5 suggestions
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

// Display suggestions in the UI
function displaySuggestions(suggestions) {
    if (!suggestions.length) {
        suggestionsContainer.classList.remove('active');
        return;
    }

    suggestionsContainer.innerHTML = suggestions
        .map((item, index) => `
            <div class="suggestion-item" data-index="${index}">
                <div class="suggestion-main">
                    ${item.name}, ${item.country}
                </div>
                <div class="suggestion-region">
                    ${item.region || ''}
                </div>
            </div>
        `)
        .join('');

    suggestionsContainer.classList.add('active');
    selectedSuggestionIndex = -1;
}

// Handle keyboard navigation
function handleKeyboardNavigation(e) {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestionItems.length - 1);
            updateSelectedSuggestion(suggestionItems);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSelectedSuggestion(suggestionItems);
            break;
            
        case 'Enter':
            e.preventDefault();
            if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                const selected = suggestions[selectedSuggestionIndex];
                searchInput.value = `${selected.name}, ${selected.country}`;
                getWeather(selected.name);
                suggestionsContainer.classList.remove('active');
            } else if (searchInput.value.trim()) {
                getWeather(searchInput.value.trim());
                suggestionsContainer.classList.remove('active');
            }
            break;
            
        case 'Escape':
            suggestionsContainer.classList.remove('active');
            selectedSuggestionIndex = -1;
            break;
    }
}

// Update the selected suggestion visual state
function updateSelectedSuggestion(items) {
    items.forEach(item => item.classList.remove('selected'));
    if (selectedSuggestionIndex >= 0) {
        items[selectedSuggestionIndex].classList.add('selected');
        items[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Event Listeners
searchInput.addEventListener('input', debounce((e) => {
    fetchSuggestions(e.target.value.trim());
}, 300));

searchInput.addEventListener('keydown', handleKeyboardNavigation);

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!suggestionsContainer.contains(e.target) && e.target !== searchInput) {
        suggestionsContainer.classList.remove('active');
    }
});

// Handle suggestion clicks
suggestionsContainer.addEventListener('click', (e) => {
    const suggestionItem = e.target.closest('.suggestion-item');
    if (suggestionItem) {
        const index = parseInt(suggestionItem.dataset.index);
        const selected = suggestions[index];
        searchInput.value = `${selected.name}, ${selected.country}`;
        getWeather(selected.name);
        suggestionsContainer.classList.remove('active');
    }
});

async function getWeather(city) {
    try {
        const response = await fetch(
            `${BASE_URL}/current.json?key=${API_KEY}&q=${city}&aqi=no`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        
        // Update UI with weather data
        weatherInfo.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        
        cityName.textContent = `${data.location.name}, ${data.location.country}`;
        temperature.textContent = `${Math.round(data.current.temp_c)}°C`;
        description.textContent = data.current.condition.text;
        humidity.textContent = `${data.current.humidity}%`;
        windSpeed.textContent = `${data.current.wind_kph} km/h`;
        
        weatherIcon.src = `https:${data.current.condition.icon}`;
        
    } catch (error) {
        weatherInfo.classList.add('hidden');
        errorDiv.classList.remove('hidden');
    }
}

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            getWeather(city);
        }
    }
});

// Load default city weather
window.addEventListener('load', () => {
    getWeather('Chandigarh');
});
