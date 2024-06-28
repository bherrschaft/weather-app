document.getElementById('get-weather').addEventListener('click', getWeather);
document.getElementById('get-location').addEventListener('click', getLocationWeather);
document.getElementById('convert-temp').addEventListener('click', convertTemperature);

let currentTempInFahrenheit = true;

async function getWeather() {
    const zipCode = document.getElementById('zipcode').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const apiKey = 'f9acd824dab7816e7165a2c185c13d65';
    
    let geoResponse, geoData;
    if (zipCode) {
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${apiKey}`);
        geoData = await geoResponse.json();
    } else if (city && state) {
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},US&appid=${apiKey}`);
        geoData = await geoResponse.json();
        geoData = geoData[0]; // First result
    } else {
        alert("Please enter a zip code or city and state.");
        return;
    }

    const lat = geoData.lat;
    const lon = geoData.lon;
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    const weatherData = await weatherResponse.json();

    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    const forecastData = await forecastResponse.json();
    
    displayWeather(weatherData, geoData.name);
    displayForecast(forecastData.list);
}

async function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const apiKey = 'f9acd824dab7816e7165a2c185c13d65';

            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const weatherData = await weatherResponse.json();

            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const forecastData = await forecastResponse.json();
            
            displayWeather(weatherData, "Your Location");
            displayForecast(forecastData.list);
        }, error => {
            alert("Unable to retrieve your location. Please check your browser settings and try again.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function displayWeather(data, city) {
    const weatherDisplay = document.getElementById('weather-display');
    currentTempInFahrenheit = true;
    document.getElementById('convert-temp').innerText = 'Convert to Celsius';

    weatherDisplay.innerHTML = `
        <h2>Weather in ${city}</h2>
        <p>Date: ${new Date(data.dt * 1000).toLocaleDateString()}</p>
        <p>Temperature: ${data.main.temp} °F</p>
        <p>Conditions: ${data.weather[0].description}</p>
        <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather Icon">
        <p>Temp Hi/Lo: ${data.main.temp_max} °F / ${data.main.temp_min} °F</p>
        <p>Feels Like: ${data.main.feels_like} °F</p>
        <p>Humidity: ${data.main.humidity}%</p>
    `;
    changeBackgroundColor(data.weather[0].main);
}

function displayForecast(data) {
    const forecastDisplay = document.getElementById('forecast-display');
    forecastDisplay.innerHTML = '<h2>5-Day 3-Hour Forecast</h2>';

    data.forEach(item => {
        forecastDisplay.innerHTML += `
            <div class="forecast-hour animate-forecast">
                <p>Date: ${new Date(item.dt * 1000).toLocaleDateString()}</p>
                <p>Time: ${new Date(item.dt * 1000).toLocaleTimeString()}</p>
                <p>Conditions: ${item.weather[0].description}</p>
                <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather Icon">
                <p>Temp: ${item.main.temp} °F</p>
                <p>Temp Hi/Lo: ${item.main.temp_max} °F / ${item.main.temp_min} °F</p>
            </div>
        `;
    });
}

function convertTemperature() {
    const weatherDisplay = document.getElementById('weather-display');
    const forecastDisplay = document.getElementById('forecast-display');
    const button = document.getElementById('convert-temp');
    
    if (currentTempInFahrenheit) {
        // Convert to Celsius
        convertToCelsius(weatherDisplay);
        convertToCelsius(forecastDisplay);
        button.innerText = 'Convert to Fahrenheit';
        currentTempInFahrenheit = false;
    } else {
        // Convert to Fahrenheit
        convertToFahrenheit(weatherDisplay);
        convertToFahrenheit(forecastDisplay);
        button.innerText = 'Convert to Celsius';
        currentTempInFahrenheit = true;
    }
}

function convertToCelsius(element) {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °F/g, (match, temp) => {
        return `${((temp - 32) * 5/9).toFixed(1)} °C`;
    });
}

function convertToFahrenheit(element) {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °C/g, (match, temp) => {
        return `${((temp * 9/5) + 32).toFixed(1)} °F`;
    });
}

function changeBackgroundColor(condition) {
    const body = document.body;
    switch (condition.toLowerCase()) {
        case 'clear':
            body.style.backgroundColor = '#87CEEB';
            break;
        case 'clouds':
            body.style.backgroundColor = '#B0C4DE';
            break;
        case 'rain':
            body.style.backgroundColor = '#778899';
            break;
        case 'snow':
            body.style.backgroundColor = '#FFFAFA';
            break;
        default:
            body.style.backgroundColor = '#F0F0F0';
    }
}
