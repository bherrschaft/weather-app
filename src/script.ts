interface GeoData {
    lat: number;
    lon: number;
    name: string;
}

interface WeatherData {
    main: {
        temp: number;
        temp_max: number;
        temp_min: number;
        feels_like: number;
        humidity: number;
    };
    weather: {
        description: string;
        icon: string;
        main: string;
    }[];
    wind: {
        speed: number;
    };
    dt: number;
    visibility: number;
    uvi: number;
}

let currentTempInFahrenheit = true;

document.addEventListener('DOMContentLoaded', () => {
    getLocationWeather();
    document.getElementById('get-weather')?.addEventListener('click', getWeather);
    document.getElementById('get-location')?.addEventListener('click', getLocationWeather);
    document.getElementById('convert-temp')?.addEventListener('click', convertTemperature);
    document.getElementById('revert-weather')?.addEventListener('click', revertToCurrentWeather);
});

const getWeather = async (): Promise<void> => {
    const zipCode = (document.getElementById('zipcode') as HTMLInputElement).value;
    const city = (document.getElementById('city') as HTMLInputElement).value;
    const state = (document.getElementById('state') as HTMLInputElement).value;
    const apiKey = 'f9acd824dab7816e7165a2c185c13d65';

    let geoResponse: Response, geoData: GeoData;

    if (zipCode) {
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${apiKey}`);
        geoData = await geoResponse.json();
    } else if (city && state) {
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},US&appid=${apiKey}`);
        const geoDataArray = await geoResponse.json();
        geoData = geoDataArray[0];
    } else {
        alert("Please enter a zip code or city and state.");
        return;
    }

    const { lat, lon } = geoData;
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    const weatherData: WeatherData = await weatherResponse.json();

    displayWeather(weatherData, geoData.name);
};

const getLocationWeather = async (): Promise<void> => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const apiKey = 'f9acd824dab7816e7165a2c185c13d65';

            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const weatherData: WeatherData = await weatherResponse.json();

            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const forecastDataCache = await forecastResponse.json();

            displayWeather(weatherData, "Your Location");
        }, error => {
            alert("Unable to retrieve your location. Please check your browser settings and try again.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

const displayWeather = (data: WeatherData, city: string): void => {
    const weatherDisplay = document.getElementById('weather-display');
    if (weatherDisplay) {
        currentTempInFahrenheit = true;
        document.getElementById('convert-temp')!.innerText = 'Convert to Celsius';

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

const changeBackgroundColor = (condition: string): void => {
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

const convertTemperature = (): void => {
    const weatherDisplay = document.getElementById('weather-display');
    const button = document.getElementById('convert-temp');
    
    if (currentTempInFahrenheit) {
        if (weatherDisplay) convertToCelsius(weatherDisplay);
        button!.innerText = 'Convert to Fahrenheit';
        currentTempInFahrenheit = false;
    } else {
        if (weatherDisplay) convertToFahrenheit(weatherDisplay);
        button!.innerText = 'Convert to Celsius';
        currentTempInFahrenheit = true;
    }
};

const convertToCelsius = (element: HTMLElement): void => {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °F/g, (match, temp) => {
        return `${((parseFloat(temp) - 32) * 5/9).toFixed(1)} °C`;
    });
};

const convertToFahrenheit = (element: HTMLElement): void => {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °C/g, (match, temp) => {
        return `${((parseFloat(temp) * 9/5) + 32).toFixed(1)} °F`;
    });
};

const revertToCurrentWeather = (): void => {
    getLocationWeather();
};
