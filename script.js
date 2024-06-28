document.getElementById('get-weather').addEventListener('click', getWeather);
document.getElementById('get-location').addEventListener('click', getLocationWeather);
document.getElementById('convert-temp').addEventListener('click', convertTemperature);
document.querySelector('.carousel-control-prev').addEventListener('click', (event) => {
    event.stopPropagation();
    $('#weather-carousel').carousel('prev');
});
document.querySelector('.carousel-control-next').addEventListener('click', (event) => {
    event.stopPropagation();
    $('#weather-carousel').carousel('next');
});

// Disable touch, keyboard, and click events
$('#weather-carousel').off('keydown.bs.carousel');
$('#weather-carousel').off('touchstart.bs.carousel');
$('#weather-carousel').off('touchmove.bs.carousel');
$('#weather-carousel').off('touchend.bs.carousel');
document.getElementById('weather-carousel').addEventListener('click', (event) => {
    event.stopPropagation();
});

let currentTempInFahrenheit = true;
let forecastDataCache = [];
let currentDayIndex = 0;

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
    forecastDataCache = await forecastResponse.json();
    
    displayWeather(weatherData, geoData.name);
    displayForecast(forecastDataCache.list, geoData.name);
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
            forecastDataCache = await forecastResponse.json();
            
            displayWeather(weatherData, "Your Location");
            displayForecast(forecastDataCache.list, "Your Location");
        }, error => {
            alert("Unable to retrieve your location. Please check your browser settings and try again.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function displayWeather(data, city) {
    const weatherDisplay = document.getElementById('weather-display');
    if (weatherDisplay) {
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
}

function displayForecast(data, city) {
    const carouselContent = document.getElementById('carousel-content');
    if (carouselContent) {
        carouselContent.innerHTML = '';

        const days = {};
        data.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!days[date]) {
                days[date] = [];
            }
            days[date].push(item);
        });

        Object.keys(days).forEach((date, index) => {
            const dayData = days[date];
            const elevenAmIndex = getElevenAmIndex(dayData);
            carouselContent.innerHTML += `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <h2>${city} - ${date}</h2>
                    <div id="forecast-${index}" class="forecast-details"></div>
                    <div class="forecast-time-buttons">
                        ${dayData.map((_, idx) => `<button class="btn btn-sm btn-primary" onclick="showForecast(${index}, ${idx})" data-index="${index}-${idx}">${new Date(dayData[idx].dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</button>`).join('')}
                    </div>
                </div>
            `;
            showForecast(index, elevenAmIndex);
        });

        // Prevent carousel from changing panes when clicking the forecast buttons
        document.querySelectorAll('.forecast-time-buttons button').forEach(button => {
            button.addEventListener('click', event => event.stopPropagation());
        });
    }
}

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

function getElevenAmIndex(dayData) {
    for (let i = 0; i < dayData.length; i++) {
        const date = new Date(dayData[i].dt * 1000);
        if (date.getHours() === 11) {
            return i;
        }
    }
    return 0; // default to the first item if 11:00 AM is not found
}

function convertTemperature() {
    const weatherDisplay = document.getElementById('weather-display');
    const carouselContent = document.getElementById('carousel-content');
    const button = document.getElementById('convert-temp');
    
    if (currentTempInFahrenheit) {
        if (weatherDisplay) convertToCelsius(weatherDisplay);
        if (carouselContent) convertToCelsius(carouselContent);
        button.innerText = 'Convert to Fahrenheit';
        currentTempInFahrenheit = false;
    } else {
        if (weatherDisplay) convertToFahrenheit(weatherDisplay);
        if (carouselContent) convertToFahrenheit(carouselContent);
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

