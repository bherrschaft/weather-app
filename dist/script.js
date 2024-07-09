"use strict";
let currentTempInFahrenheit = true;
document.addEventListener('DOMContentLoaded', () => {
    var _a, _b, _c, _d;
    getLocationWeather();
    (_a = document.getElementById('get-weather')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', getWeather);
    (_b = document.getElementById('get-location')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', getLocationWeather);
    (_c = document.getElementById('convert-temp')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', convertTemperature);
    (_d = document.getElementById('revert-weather')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', revertToCurrentWeather);
});
const getWeather = async () => {
    const zipCode = document.getElementById('zipcode').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const apiKey = 'f9acd824dab7816e7165a2c185c13d65';
    let geoResponse, geoData;
    if (zipCode) {
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${apiKey}`);
        geoData = await geoResponse.json();
    }
    else if (city && state) {
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},US&appid=${apiKey}`);
        const geoDataArray = await geoResponse.json();
        geoData = geoDataArray[0];
    }
    else {
        alert("Please enter a zip code or city and state.");
        return;
    }
    const { lat, lon } = geoData;
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    const weatherData = await weatherResponse.json();
    displayWeather(weatherData, geoData.name);
};
const getLocationWeather = async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const apiKey = 'f9acd824dab7816e7165a2c185c13d65';
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const weatherData = await weatherResponse.json();
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const forecastDataCache = await forecastResponse.json();
            displayWeather(weatherData, "Your Location");
        }, error => {
            alert("Unable to retrieve your location. Please check your browser settings and try again.");
        });
    }
    else {
        alert("Geolocation is not supported by this browser.");
    }
};
const displayWeather = (data, city) => {
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
            <p>Wind Speed: ${data.wind.speed} mph</p>
            <p>UV Index: ${data.uvi}</p>
            <p>Visibility: ${data.visibility / 1000} km</p>
        `;
        changeBackgroundColor(data.weather[0].main);
    }
};
const changeBackgroundColor = (condition) => {
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
};
const convertTemperature = () => {
    const weatherDisplay = document.getElementById('weather-display');
    const button = document.getElementById('convert-temp');
    if (currentTempInFahrenheit) {
        if (weatherDisplay)
            convertToCelsius(weatherDisplay);
        button.innerText = 'Convert to Fahrenheit';
        currentTempInFahrenheit = false;
    }
    else {
        if (weatherDisplay)
            convertToFahrenheit(weatherDisplay);
        button.innerText = 'Convert to Celsius';
        currentTempInFahrenheit = true;
    }
};
const convertToCelsius = (element) => {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °F/g, (match, temp) => {
        return `${((parseFloat(temp) - 32) * 5 / 9).toFixed(1)} °C`;
    });
};
const convertToFahrenheit = (element) => {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °C/g, (match, temp) => {
        return `${((parseFloat(temp) * 9 / 5) + 32).toFixed(1)} °F`;
    });
};
const revertToCurrentWeather = () => {
    getLocationWeather();
};
