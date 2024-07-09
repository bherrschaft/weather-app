// Define an interface for geographic data
interface GeoData {
    lat: number;  // Latitude
    lon: number;  // Longitude
    name: string; // Name of the location
}

// Define an interface for weather data
interface WeatherData {
    main: {
        temp: number;        // Current temperature
        temp_max: number;    // Maximum temperature
        temp_min: number;    // Minimum temperature
        feels_like: number;  // Feels-like temperature
        humidity: number;    // Humidity percentage
    };
    weather: {
        description: string; // Weather description
        icon: string;        // Weather icon
        main: string;        // Main weather condition
    }[];
    wind: {
        speed: number;       // Wind speed
    };
    dt: number;              // Date and time of the weather data
    visibility: number;      // Visibility in meters
    uvi: number;             // UV index
}

// Define an interface for forecast data
interface ForecastData {
    dt: number;  // Date and time of the forecast data
    main: {
        temp: number;        // Current temperature
        temp_max: number;    // Maximum temperature
        temp_min: number;    // Minimum temperature
    };
    weather: {
        description: string; // Weather description
        icon: string;        // Weather icon
    }[];
}

// Global variables to store weather and forecast data
let currentTempInFahrenheit = true;  // Flag to track if the current temperature is in Fahrenheit
let forecastDataCache: { list: ForecastData[] };  // Cache for forecast data
let initialWeatherData: WeatherData;  // Initial weather data
let initialForecastData: { list: ForecastData[] };  // Initial forecast data

// Event listener for when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    getLocationWeather();  // Get weather for the current location
    document.getElementById('get-weather')?.addEventListener('click', getWeather);  // Event listener for getting weather
    document.getElementById('get-location')?.addEventListener('click', getLocationWeather);  // Event listener for getting location weather
    document.getElementById('convert-temp')?.addEventListener('click', convertTemperature);  // Event listener for converting temperature
    document.getElementById('revert-weather')?.addEventListener('click', revertToCurrentWeather);  // Event listener for reverting to current weather
    document.querySelector('.carousel-control-prev')?.addEventListener('click', (event) => {
        event.stopPropagation();  // Prevent the event from propagating
        $('#weather-carousel').carousel('prev');  // Move the carousel to the previous item
    });
    document.querySelector('.carousel-control-next')?.addEventListener('click', (event) => {
        event.stopPropagation();  // Prevent the event from propagating
        $('#weather-carousel').carousel('next');  // Move the carousel to the next item
    });
});

// Function to get weather based on user input
const getWeather = async (): Promise<void> => {
    const zipCode = (document.getElementById('zipcode') as HTMLInputElement).value;
    const city = (document.getElementById('city') as HTMLInputElement).value;
    const state = (document.getElementById('state') as HTMLInputElement).value;
    const apiKey = 'f9acd824dab7816e7165a2c185c13d65';

    let geoResponse: Response, geoData: GeoData;

    if (zipCode) {
        // Fetch geographic data based on zip code
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${apiKey}`);
        geoData = await geoResponse.json();
    } else if (city && state) {
        // Fetch geographic data based on city and state
        geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},US&appid=${apiKey}`);
        const geoDataArray = await geoResponse.json();
        geoData = geoDataArray[0];
    } else {
        alert("Please enter a zip code or city and state.");
        return;
    }

    const { lat, lon } = geoData;
    // Fetch weather data based on latitude and longitude
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    const weatherData: WeatherData = await weatherResponse.json();

    // Fetch forecast data based on latitude and longitude
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
    forecastDataCache = await forecastResponse.json();
    
    initialWeatherData = weatherData;
    initialForecastData = forecastDataCache;

    displayWeather(weatherData, geoData.name);  // Display the weather data
    displayForecast(forecastDataCache.list, geoData.name);  // Display the forecast data
};

// Function to get weather for the current location
const getLocationWeather = async (): Promise<void> => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const apiKey = 'f9acd824dab7816e7165a2c185c13d65';

            // Fetch weather data based on current location
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            const weatherData: WeatherData = await weatherResponse.json();

            // Fetch forecast data based on current location
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
            forecastDataCache = await forecastResponse.json();

            initialWeatherData = weatherData;
            initialForecastData = forecastDataCache;

            displayWeather(weatherData, "Your Location");  // Display the weather data for current location
            displayForecast(forecastDataCache.list, "Your Location");  // Display the forecast data for current location
        }, error => {
            alert("Unable to retrieve your location. Please check your browser settings and try again.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Function to display weather data
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
        changeBackgroundColor(data.weather[0].main);  // Change the background color based on the weather condition
    }
};

// Function to display forecast data
const displayForecast = (data: ForecastData[], city: string): void => {
    const carouselContent = document.getElementById('carousel-content');
    if (carouselContent) {
        carouselContent.innerHTML = '';

        // Group forecast data by day
        const days: { [key: string]: ForecastData[] } = {};
        data.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!days[date]) {
                days[date] = [];
            }
            days[date].push(item);
        });

        // Create carousel items for each day
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
            showForecast(index, elevenAmIndex);  // Show forecast for 11 AM by default
        });

        // Prevent button clicks from propagating
        document.querySelectorAll('.forecast-time-buttons button').forEach(button => {
            button.addEventListener('click', event => event.stopPropagation());
        });
    }
};

// Function to show forecast for a specific time
const showForecast = (dayIndex: number, timeIndex: number): void => {
    const days = Object.keys(forecastDataCache.list.reduce((days, item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!days[date]) days[date] = [];
        days[date].push(item);
        return days;
    }, {} as { [key: string]: ForecastData[] }));
    
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
};

// Function to get the index of the 11 AM forecast data
const getElevenAmIndex = (dayData: ForecastData[]): number => {
    for (let i = 0; i < dayData.length; i++) {
        const date = new Date(dayData[i].dt * 1000);
        if (date.getHours() === 11) {
            return i;
        }
    }
    return 0;
};

// Function to convert temperature between Fahrenheit and Celsius
const convertTemperature = (): void => {
    const weatherDisplay = document.getElementById('weather-display');
    const carouselContent = document.getElementById('carousel-content');
    const button = document.getElementById('convert-temp');
    
    if (currentTempInFahrenheit) {
        if (weatherDisplay) convertToCelsius(weatherDisplay);
        if (carouselContent) convertToCelsius(carouselContent);
        button!.innerText = 'Convert to Fahrenheit';
        currentTempInFahrenheit = false;
    } else {
        if (weatherDisplay) convertToFahrenheit(weatherDisplay);
        if (carouselContent) convertToFahrenheit(carouselContent);
        button!.innerText = 'Convert to Celsius';
        currentTempInFahrenheit = true;
    }
};

// Function to convert temperatures in an element to Celsius
const convertToCelsius = (element: HTMLElement): void => {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °F/g, (match, temp) => {
        return `${((parseFloat(temp) - 32) * 5/9).toFixed(1)} °C`;
    });
};

// Function to convert temperatures in an element to Fahrenheit
const convertToFahrenheit = (element: HTMLElement): void => {
    element.innerHTML = element.innerHTML.replace(/(\d+\.?\d*) °C/g, (match, temp) => {
        return `${((parseFloat(temp) * 9/5) + 32).toFixed(1)} °F`;
    });
};

// Function to change the background color based on the weather condition
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

// Function to revert to the initial weather and forecast data
const revertToCurrentWeather = (): void => {
    if (initialWeatherData && initialForecastData) {
        displayWeather(initialWeatherData, "Your Location");
        displayForecast(initialForecastData.list, "Your Location");
    }
};
