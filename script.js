// Wait until the entire page is loaded before running the code inside
document.addEventListener('DOMContentLoaded', () => {
    // Get the weather for the current location when the page loads
    getLocationWeather();
});

// Add a click event listener to the "Get Weather" button
document.getElementById('get-weather').addEventListener('click', getWeather);
// Add a click event listener to the "Use Current Location" button
document.getElementById('get-location').addEventListener('click', getLocationWeather);
// Add a click event listener to the "Convert Temperature" button
document.getElementById('convert-temp').addEventListener('click', convertTemperature);
// Add a click event listener to the "Revert Weather" button
document.getElementById('revert-weather').addEventListener('click', revertToCurrentWeather);
// Add a click event listener to the previous carousel control
document.querySelector('.carousel-control-prev').addEventListener('click', (event) => {
    // Prevent the event from affecting other elements
    event.stopPropagation();
    // Move the carousel to the previous item
    $('#weather-carousel').carousel('prev');
});
// Add a click event listener to the next carousel control
document.querySelector('.carousel-control-next').addEventListener('click', (event) => {
    // Prevent the event from affecting other elements
    event.stopPropagation();
    // Move the carousel to the next item
    $('#weather-carousel').carousel('next');
});

// Disable various events on the carousel to prevent unwanted interactions
$('#weather-carousel').off('keydown.bs.carousel'); // Disable keyboard interactions
$('#weather-carousel').off('touchstart.bs.carousel'); // Disable touch interactions
$('#weather-carousel').off('touchmove.bs.carousel'); // Disable touch interactions
$('#weather-carousel').off('touchend.bs.carousel'); // Disable touch interactions
// Add a click event listener to the carousel
document.getElementById('weather-carousel').addEventListener('click', (event) => {
    // Prevent the event from affecting other elements
    event.stopPropagation();
});

// Initialize some variables to store weather data
let currentTempInFahrenheit = true;
let forecastDataCache = [];
let currentDayIndex = 0;
let initialWeatherData, initialForecastData;

// Function to get the weather based on user input
async function getWeather() {
    // Get the input values from the HTML form
    const zipCode = document.getElementById('zipcode').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const apiKey = 'f9acd824dab7816e7165a2c185c13d65';

    let geoResponse, geoData;
    if (zipCode) {
        // If a zip code is provided, fetch the geographical data using the zip code
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${apiKey}`);
        geoData = await geoResponse.json();
    } else if (city && state) {
        // If city and state are provided, fetch the geographical data using the city and state
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},US&appid=${apiKey}`);
        geoData = await geoResponse.json();
        geoData = geoData[0]; // Use the first result from the response
    } else {
        // Alert the user if neither zip code nor city/state are provided
        alert("Please enter a zip code or city and state.");
        return; // Exit the function if input is incomplete
    }

    // Extract latitude and longitude from the geographical data
    const lat = geoData.lat;
    const lon = geoData.lon;
    // Fetch the current weather data using latitude and longitude
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    const weatherData = await weatherResponse.json();

    // Fetch the weather forecast data using latitude and longitude
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    forecastDataCache = await forecastResponse.json();
    
    // Display the current weather and forecast data on the page
    displayWeather(weatherData, geoData.name);
    displayForecast(forecastDataCache.list, geoData.name);
}

// Function to get the weather based on the user's current location
async function getLocationWeather() {
    if (navigator.geolocation) {
        // If geolocation is supported, get the current position
        navigator.geolocation.getCurrentPosition(async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const apiKey = 'f9acd824dab7816e7165a2c185c13d65';

            // Fetch the current weather data using latitude and longitude
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const weatherData = await weatherResponse.json();

            // Fetch the weather forecast data using latitude and longitude
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            forecastDataCache = await forecastResponse.json();

            // Store the initial weather data for later use
            initialWeatherData = weatherData;
            initialForecastData = forecastDataCache;
            
            // Display the current weather and forecast data on the page
            displayWeather(weatherData, "Your Location");
            displayForecast(forecastDataCache.list, "Your Location");
        }, error => {
            // Alert the user if there is an error getting the location
            alert("Unable to retrieve your location. Please check your browser settings and try again.");
        });
    } else {
        // Alert the user if geolocation is not supported
        alert("Geolocation is not supported by this browser.");
    }
}

// Function to display the current weather on the page
function displayWeather(data, city) {
    const weatherDisplay = document.getElementById('weather-display');
    if (weatherDisplay) {
        currentTempInFahrenheit = true; // Set the temperature unit to Fahrenheit
        document.getElementById('convert-temp').innerText = 'Convert to Celsius'; // Update the button text

        // Set the inner HTML of the weather display element with weather data
        weatherDisplay.innerHTML = `
            <h2>Weather in ${city}</h2>
            <p>Date: ${new Date(data.dt * 1000).toLocaleDateString()}</p>
            <p>Temperature: ${data.main.temp} °F</p>
            <p>Conditions: ${data.weather[0].description}</p>
            <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather Icon">
            <p>Temp Hi/Lo: ${data.main.temp_max} °F / ${data.main.temp_min} °F</p>
            <p>Feels Like: ${data.main.feels_like} °F</p>
            <p>Humidity: ${data.main.humidity}%</p>
            <p>Wind Speed: ${data.wind.speed} mph</p>
            <p>UV Index: ${data.uvi}</p>
            <p>Visibility: ${data.visibility / 1000} km</p>
        `;
        changeBackgroundColor(data.weather[0].main); // Change the background color based on weather conditions
    }
}

// Function to display the weather forecast on the page
function displayForecast(data, city) {
    const carouselContent = document.getElementById('carousel-content');
    if (carouselContent) {
        carouselContent.innerHTML = ''; // Clear the current carousel content

        // Group the forecast data by date
        const days = {};
        data.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!days[date]) {
                days[date] = [];
            }
            days[date].push(item);
        });

        // Create a carousel item for each day
        Object.keys(days).forEach((date, index) => {
            const dayData = days[date];
            const elevenAmIndex = getElevenAmIndex(dayData); // Get the index for 11:00 AM forecast
            carouselContent.innerHTML += `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <h2>${city} - ${date}</h2>
                    <div id="forecast-${index}" class="forecast-details"></div>
                    <div class="forecast-time-buttons">
                        ${dayData.map((_, idx) => `<button class="btn btn-sm btn-primary" onclick="showForecast(${index}, ${idx})" data-index="${index}-${idx}">${new Date(dayData[idx].dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</button>`).join('')}
                    </div>
                </div>
            `;
            showForecast(index, elevenAmIndex); // Show the forecast for 11:00 AM by default
        });

        // Prevent carousel from changing panes when clicking the forecast buttons
        document.querySelectorAll('.forecast-time-buttons button').forEach(button => {
            button.addEventListener('click', event => event.stopPropagation());
        });
    }
}

// Function to show the forecast for a specific time
function showForecast(dayIndex, timeIndex) {
    const days = Object.keys(forecastDataCache.list.reduce((days, item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!days[date]) days[date] = [];
        days[date].push(item);
        return days;
    }, {}));
    
    const dayData = forecastDataCache.list.filter(item => {
        return new Date(item.dt * 1000).toLocaleDateString() === days[dayIndex];
    });

    const forecastDetails = document.getElementById(`forecast-${dayIndex}`);
    if (forecastDetails) {
        const data = dayData[timeIndex];
        forecastDetails.innerHTML = `
            <p>Time: ${new Date(data.dt * 1000).toLocaleTimeString()}</p>
            <p>Temp: ${data.main.temp} °F</p>
            <p>Conditions: ${data.weather[0].description}</p>
            <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather Icon">
            <p>Temp Hi/Lo: ${data.main.temp_max} °F / ${data.main.temp_min} °F</p>
        `;
    }
}

// Function to get the index of the forecast data for 11:00 AM
function getElevenAmIndex(dayData) {
    for (let i = 0; i < dayData.length; i++) {
        const date = new Date(dayData[i].dt * 1000);
        if (date.getHours() === 11) {
            return i;
        }
    }
    return 0; // Default to the first item if 11:00 AM is not found
}

// Function to convert the temperature between Fahrenheit and Celsius
function convertTemperature() {
    const weatherDisplay = document.getElementById('weather-display');
    const carouselContent = document.getElementById('carousel-content');
    const button = document.getElementById('convert-temp');
    
    if (currentTempInFahrenheit) {
        if (weatherDisplay) convertToCelsius(weatherDisplay);
        if (carouselContent) convertToCelsius(carouselContent);
        button.innerText = 'Convert to Fahrenheit'; // Update the button text
        currentTempInFahrenheit = false; // Set the temperature unit to Celsius
    } else {
        if (weatherDisplay) convertToFahrenheit(weatherDisplay);
        if (carouselContent) convertToFahrenheit(carouselContent);
        button.innerText = 'Convert to Celsius'; // Update the button text
        currentTempInFahrenheit = true; // Set the temperature unit to Fahrenheit
    }
}

// Function to convert temperatures to Celsius
function convertToCelsius(element) {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °F/g, (match, temp) => {
        return `${((temp - 32) * 5/9).toFixed(1)} °C`; // Convert and format temperature
    });
}

// Function to convert temperatures to Fahrenheit
function convertToFahrenheit(element) {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °C/g, (match, temp) => {
        return `${((temp * 9/5) + 32).toFixed(1)} °F`; // Convert and format temperature
    });
}

// Function to change the background color based on weather conditions
function changeBackgroundColor(condition) {
    const body = document.body;
    switch (condition.toLowerCase()) {
        case 'clear':
            body.style.backgroundColor = '#87CEEB'; // Light blue for clear skies
            break;
        case 'clouds':
            body.style.backgroundColor = '#B0C4DE'; // Light steel blue for cloudy weather
            break;
        case 'rain':
            body.style.backgroundColor = '#778899'; // Light slate gray for rainy weather
            break;
        case 'snow':
            body.style.backgroundColor = '#FFFAFA'; // Snow white for snowy weather
            break;
        default:
            body.style.backgroundColor = '#F0F0F0'; // Light gray for other weather conditions
    }
}

// Function to revert to the initial weather data
function revertToCurrentWeather() {
    if (initialWeatherData && initialForecastData) {
        displayWeather(initialWeatherData, "Your Location"); // Display the initial weather data
        displayForecast(initialForecastData.list, "Your Location"); // Display the initial forecast data
    }
}
