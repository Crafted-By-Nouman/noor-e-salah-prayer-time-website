// Global Variables
let prayerTimes = {};
let currentLocation = {};
let nextPrayer = {};
let countdownInterval;
let clockInterval;
let azanAudio = new Audio();
let fatihaAudio = new Audio();
let isAzanEnabled = true;
let qiblaDirection = 0;
let countries = {};
let cities = {};

// DOM Elements
const elements = {
  loadingSpinner: document.querySelector(".loading-spinner"),
  dayName: document.getElementById("day-name"),
  gregorianDate: document.getElementById("gregorian-date"),
  hijriDayName: document.getElementById("hijri-day-name"),
  hijriDate: document.getElementById("hijri-date"),
  digitalTime: document.getElementById("digital-time"),
  hourHand: document.getElementById("hour-hand"),
  minuteHand: document.getElementById("minute-hand"),
  secondHand: document.getElementById("second-hand"),
  locationText: document.getElementById("location-text"),
  countrySelect: document.getElementById("country-select"),
  citySelect: document.getElementById("city-select"),
  nextPrayerName: document.getElementById("next-prayer-name"),
  nextPrayerTime: document.getElementById("next-prayer-time"),
  countdownText: document.getElementById("countdown-text"),
  prayerTimesContainer: document.getElementById("prayer-times-container"),
  ayahText: document.getElementById("ayah-text"),
  ayahTranslation: document.getElementById("ayah-translation"),
  ayahReference: document.getElementById("ayah-reference"),
  hadithText: document.getElementById("hadith-text"),
  hadithReference: document.getElementById("hadith-reference"),
  compassArrow: document.getElementById("compass-arrow"),
  qiblaInfo: document.getElementById("qibla-info"),
  jummahCountdown: document.getElementById("jummah-countdown"),
  eidCountdown: document.getElementById("eid-countdown"),
  hajjCountdown: document.getElementById("hajj-countdown"),
  ramadanCountdown: document.getElementById("ramadan-countdown"),
  azanToggle: document.getElementById("azan-toggle"),
  fatihaBtn: document.getElementById("fatiha-btn"),
};

// Initialize the application
function init() {
  updateDateTime();
  clockInterval = setInterval(updateDateTime, 1000);
  getLocation();
  loadCountries();
  fetchRandomAyah();
  fetchRandomHadith();
  setupEventListeners();
  calculateIslamicEvents();
  setupCompass();
}

// Setup event listeners
function setupEventListeners() {
  elements.countrySelect.addEventListener("change", handleCountrySelect);
  elements.citySelect.addEventListener("change", handleCitySelect);
  elements.azanToggle.addEventListener("click", toggleAzan);
  elements.fatihaBtn.addEventListener("click", playFatiha);

  // Theme buttons are handled via onclick in HTML
}

// Update date and time
function updateDateTime() {
  const now = new Date();

  // Digital clock
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  elements.digitalTime.textContent = now.toLocaleTimeString(
    undefined,
    timeOptions
  );

  // Analog clock
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  elements.hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
  elements.minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
  elements.secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;

  // Date
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  elements.dayName.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
  });
  elements.gregorianDate.textContent = now.toLocaleDateString(
    undefined,
    dateOptions
  );

  // Update Hijri date if we have it
  updateHijriDate(now);

  // Update next prayer countdown if we have prayer times
  if (nextPrayer.time) {
    updateNextPrayerCountdown(now);
  }
}

// Update Hijri date
function updateHijriDate(gregorianDate) {
  // For a real app, you would use an API to get accurate Hijri dates
  // This is a simplified version that approximates the Hijri date

  // Base date: 1 Muharram 1445 AH = July 19, 2023
  const baseHijri = { year: 1445, month: 0, day: 1 };
  const baseGregorian = new Date(2023, 6, 19); // July is month 6 (0-indexed)

  const diffTime = gregorianDate - baseGregorian;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Approximate Hijri date (30 days per month)
  let hijriDays = baseHijri.day + diffDays;
  let hijriMonth = baseHijri.month;
  let hijriYear = baseHijri.year;

  while (hijriDays > 30) {
    hijriDays -= 30;
    hijriMonth++;

    if (hijriMonth >= 12) {
      hijriMonth = 0;
      hijriYear++;
    }
  }

  const hijriMonths = [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Awwal",
    "Jumada al-Thani",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qi'dah",
    "Dhu al-Hijjah",
  ];

  const hijriWeekdays = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const hijriWeekday = hijriWeekdays[gregorianDate.getDay()];

  elements.hijriDayName.textContent = hijriWeekday;
  elements.hijriDate.textContent = `${hijriDays} ${hijriMonths[hijriMonth]} ${hijriYear}`;
}

// Get user location
function getLocation() {
  showLoading();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLocation.latitude = position.coords.latitude;
        currentLocation.longitude = position.coords.longitude;
        fetchLocationName(position.coords.latitude, position.coords.longitude);
        fetchPrayerTimes(position.coords.latitude, position.coords.longitude);
        calculateQiblaDirection(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
        elements.locationText.textContent =
          "Location access denied. Please select manually.";
        hideLoading();

        // Set default location (Mecca)
        currentLocation.latitude = 21.3891;
        currentLocation.longitude = 39.8579;
        currentLocation.city = "Mecca";
        currentLocation.country = "Saudi Arabia";
        elements.locationText.textContent = "Default: Mecca, Saudi Arabia";
        fetchPrayerTimes(currentLocation.latitude, currentLocation.longitude);
        calculateQiblaDirection(
          currentLocation.latitude,
          currentLocation.longitude
        );
      }
    );
  } else {
    elements.locationText.textContent =
      "Geolocation not supported. Please select manually.";
    hideLoading();
  }
}

// Fetch location name from coordinates
function fetchLocationName(latitude, longitude) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      currentLocation.city = data.city || data.locality || "Unknown City";
      currentLocation.country = data.countryName || "Unknown Country";
      elements.locationText.textContent = `${currentLocation.city}, ${currentLocation.country}`;

      // Try to find matching country and city in selects
      const countryOption = Array.from(elements.countrySelect.options).find(
        (option) => option.text.includes(currentLocation.country)
      );

      if (countryOption) {
        elements.countrySelect.value = countryOption.value;
        handleCountrySelect();

        // Try to find matching city
        setTimeout(() => {
          const cityOption = Array.from(elements.citySelect.options).find(
            (option) => option.text.includes(currentLocation.city)
          );

          if (cityOption) {
            elements.citySelect.value = cityOption.value;
          }
        }, 500);
      }
    })
    .catch((error) => {
      console.error("Error fetching location name:", error);
      elements.locationText.textContent = `${latitude.toFixed(
        2
      )}, ${longitude.toFixed(2)}`;
    });
}

// Fetch prayer times from Aladhan API
function fetchPrayerTimes(latitude, longitude) {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // For demonstration, we'll use a static response
  // In a real app, you would use the actual API:
  // const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=2`;

  // Mock prayer times (based on Mecca for demo purposes)
  const mockPrayerTimes = {
    Fajr: "04:30",
    Sunrise: "05:45",
    Dhuhr: "12:30",
    Asr: "15:45",
    Maghrib: "18:30",
    Isha: "20:00",
    Imsak: "04:20",
    Midnight: "23:30",
  };

  // Process the prayer times
  processPrayerTimes(mockPrayerTimes);

  // In a real app, you would use:
  /*
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200 && data.data) {
                        processPrayerTimes(data.data.timings);
                    } else {
                        throw new Error("Invalid prayer times data");
                    }
                })
                .catch(error => {
                    console.error("Error fetching prayer times:", error);
                    alert("Failed to fetch prayer times. Please try again later.");
                    hideLoading();
                });
            */
}

// Process prayer times data
function processPrayerTimes(timings) {
  // Extract the 5 main prayers
  prayerTimes = {
    Fajr: formatTime(timings.Fajr),
    Dhuhr: formatTime(timings.Dhuhr),
    Asr: formatTime(timings.Asr),
    Maghrib: formatTime(timings.Maghrib),
    Isha: formatTime(timings.Isha),
  };

  // Render prayer cards
  renderPrayerCards();

  // Determine next prayer
  determineNextPrayer();

  hideLoading();
}

// Format time from "04:30 (EET)" to "04:30 AM"
function formatTime(timeString) {
  // Extract just the time part (remove timezone)
  const time = timeString.split(" ")[0];
  const [hours, minutes] = time.split(":").map(Number);

  // Convert to 12-hour format
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Render prayer cards
function renderPrayerCards() {
  const prayers = [
    { name: "Fajr", icon: "fas fa-sun", time: prayerTimes.Fajr },
    { name: "Dhuhr", icon: "fas fa-sun", time: prayerTimes.Dhuhr },
    { name: "Asr", icon: "fas fa-sun", time: prayerTimes.Asr },
    { name: "Maghrib", icon: "fas fa-moon", time: prayerTimes.Maghrib },
    { name: "Isha", icon: "fas fa-moon", time: prayerTimes.Isha },
  ];

  elements.prayerTimesContainer.innerHTML = prayers
    .map(
      (prayer) => `
                <div class="prayer-card" id="prayer-${prayer.name.toLowerCase()}">
                    <i class="${prayer.icon} prayer-icon"></i>
                    <div class="prayer-name">${prayer.name}</div>
                    <div class="prayer-time">${prayer.time}</div>
                    <div class="prayer-remaining"></div>
                </div>
            `
    )
    .join("");
}

// Determine next prayer
function determineNextPrayer() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: "Fajr", time: convertTimeToMinutes(prayerTimes.Fajr) },
    { name: "Dhuhr", time: convertTimeToMinutes(prayerTimes.Dhuhr) },
    { name: "Asr", time: convertTimeToMinutes(prayerTimes.Asr) },
    { name: "Maghrib", time: convertTimeToMinutes(prayerTimes.Maghrib) },
    { name: "Isha", time: convertTimeToMinutes(prayerTimes.Isha) },
  ];

  // Find the next prayer
  let next = null;
  for (const prayer of prayers) {
    if (prayer.time > currentTime) {
      next = prayer;
      break;
    }
  }

  // If no prayer found (it's after Isha), next is Fajr tomorrow
  if (!next) {
    next = {
      name: "Fajr",
      time: prayers[0].time + 24 * 60, // Add 24 hours
    };
  }

  nextPrayer = {
    name: next.name,
    time: next.time,
    displayTime: prayers.find((p) => p.name === next.name).time,
  };

  // Update UI
  updateNextPrayerUI();

  // Start countdown
  if (countdownInterval) clearInterval(countdownInterval);
  updateNextPrayerCountdown(now);
  countdownInterval = setInterval(
    () => updateNextPrayerCountdown(new Date()),
    1000
  );
}

// Convert time string "04:30 AM" to minutes since midnight
function convertTimeToMinutes(timeStr) {
  const [time, period] = timeStr.split(" ");
  const [hours, minutes] = time.split(":").map(Number);

  let total = (hours % 12) * 60 + minutes;
  if (period === "PM") total += 12 * 60;

  return total;
}

// Update next prayer UI
function updateNextPrayerUI() {
  elements.nextPrayerName.textContent = `Next Prayer: ${nextPrayer.name}`;
  elements.nextPrayerTime.textContent = `Starts at ${
    prayerTimes[nextPrayer.name]
  }`;

  // Highlight active prayer card
  document.querySelectorAll(".prayer-card").forEach((card) => {
    card.classList.remove("active");
  });

  document
    .getElementById(`prayer-${nextPrayer.name.toLowerCase()}`)
    .classList.add("active");
}

// Update next prayer countdown
function updateNextPrayerCountdown(now) {
  const currentTime =
    now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds();
  const nextPrayerTime = nextPrayer.time * 60;

  let diff = nextPrayerTime - currentTime;

  // If it's negative (for Fajr next day), add 24 hours
  if (diff < 0) diff += 24 * 60 * 60;

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  elements.countdownText.textContent = `${hours}h ${minutes}m ${seconds}s`;

  // Update remaining time on prayer cards
  document.querySelectorAll(".prayer-remaining").forEach((el) => {
    const prayerName = el.closest(".prayer-card").id.replace("prayer-", "");

    if (prayerName === nextPrayer.name.toLowerCase()) {
      el.textContent = `Starts in ${hours}h ${minutes}m`;
    } else {
      el.textContent = "";
    }
  });

  // Check if it's time for prayer (for azan)
  if (diff === 0 && isAzanEnabled) {
    playAzan(nextPrayer.name);
  }
}

// Play azan
function playAzan(prayerName) {
  // In a real app, you would have different azan audio files for each prayer
  azanAudio.src =
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Placeholder
  azanAudio
    .play()
    .then(() => {
      // Show notification
      showNotification(`It's time for ${prayerName} prayer`);
    })
    .catch((error) => {
      console.error("Error playing azan:", error);
    });
}

// Toggle azan sound
function toggleAzan() {
  isAzanEnabled = !isAzanEnabled;
  elements.azanToggle.classList.toggle("active", isAzanEnabled);
  elements.azanToggle.innerHTML = isAzanEnabled
    ? '<i class="fas fa-volume-up"></i>'
    : '<i class="fas fa-volume-mute"></i>';
}

// Play Surah Al-Fatiha
function playFatiha() {
  fatihaAudio.src =
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
  fatihaAudio.play().catch((error) => {
    console.error("Error playing Fatiha:", error);
  });
}

// Show notification
function showNotification(message) {
  // In a real app, you would use the Notifications API or a custom UI
  alert(message);
}

// Load countries list
function loadCountries() {
  // In a real app, you would fetch this from an API
  // For demo, we'll use a small sample
  countries = {
    SA: "Saudi Arabia",
    EG: "Egypt",
    PK: "Pakistan",
    US: "United States",
    GB: "United Kingdom",
    AE: "United Arab Emirates",
  };

  // Populate country select
  elements.countrySelect.innerHTML = `
                <option value="">Select Country</option>
                ${Object.entries(countries)
                  .map(
                    ([code, name]) => `
                    <option value="${code}">${name}</option>
                `
                  )
                  .join("")}
            `;
}

// Handle country select change
function handleCountrySelect() {
  const countryCode = elements.countrySelect.value;

  if (!countryCode) {
    elements.citySelect.innerHTML = '<option value="">Select City</option>';
    elements.citySelect.disabled = true;
    return;
  }

  // In a real app, you would fetch cities for the selected country from an API
  // For demo, we'll use a small sample
  const countryCities = {
    SA: ["Mecca", "Medina", "Riyadh", "Jeddah"],
    EG: ["Cairo", "Alexandria", "Giza", "Luxor"],
    PK: ["Karachi", "Lahore", "Islamabad", "Peshawar"],
    US: ["New York", "Los Angeles", "Chicago", "Houston"],
    GB: ["London", "Birmingham", "Manchester", "Liverpool"],
    AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  };

  // Populate city select
  elements.citySelect.innerHTML = `
                <option value="">Select City</option>
                ${countryCities[countryCode]
                  .map(
                    (city) => `
                    <option value="${city.toLowerCase()}">${city}</option>
                `
                  )
                  .join("")}
            `;

  elements.citySelect.disabled = false;
}

// Handle city select change
function handleCitySelect() {
  const city = elements.citySelect.value;
  if (!city) return;

  const country =
    elements.countrySelect.options[elements.countrySelect.selectedIndex].text;
  elements.locationText.textContent = `${
    elements.citySelect.options[elements.citySelect.selectedIndex].text
  }, ${country}`;

  // In a real app, you would fetch coordinates for the selected city
  // For demo, we'll use some defaults
  const cityCoordinates = {
    mecca: { lat: 21.3891, lng: 39.8579 },
    medina: { lat: 24.5247, lng: 39.5692 },
    cairo: { lat: 30.0444, lng: 31.2357 },
    karachi: { lat: 24.8607, lng: 67.0011 },
    "new york": { lat: 40.7128, lng: -74.006 },
    london: { lat: 51.5074, lng: -0.1278 },
    dubai: { lat: 25.2769, lng: 55.2962 },
  };

  const coords = cityCoordinates[city] || { lat: 21.3891, lng: 39.8579 }; // Default to Mecca

  currentLocation.latitude = coords.lat;
  currentLocation.longitude = coords.lng;
  currentLocation.city =
    elements.citySelect.options[elements.citySelect.selectedIndex].text;
  currentLocation.country = country;

  showLoading();
  fetchPrayerTimes(coords.lat, coords.lng);
  calculateQiblaDirection(coords.lat, coords.lng);
}

// Calculate Qibla direction
function calculateQiblaDirection(latitude, longitude) {
  // Mecca coordinates
  const meccaLat = 21.3891;
  const meccaLng = 39.8579;

  // Convert to radians
  const φ1 = (latitude * Math.PI) / 180;
  const φ2 = (meccaLat * Math.PI) / 180;
  const Δλ = ((meccaLng - longitude) * Math.PI) / 180;

  // Calculate bearing
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  qiblaDirection = ((θ * 180) / Math.PI + 360) % 360;

  // Update compass
  updateCompass();
}

// Setup compass
function setupCompass() {
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", handleOrientation, true);
  } else {
    elements.qiblaInfo.textContent = "Device orientation not supported";
  }
}

// Handle device orientation
function handleOrientation(event) {
  if (event.alpha !== null) {
    const alpha = event.alpha; // compass direction (0-360)
    const beta = event.beta; // front-to-back tilt
    const gamma = event.gamma; // left-to-right tilt

    // Adjust for device orientation
    let angle = 360 - alpha; // Invert and convert to clockwise
    angle = (angle + qiblaDirection) % 360;

    // Update compass arrow
    elements.compassArrow.style.transform = `translateX(-50%) rotate(${angle}deg)`;

    // Update info text
    const direction = getDirectionFromAngle(angle);
    elements.qiblaInfo.textContent = `Face ${direction} for Qibla (${Math.round(
      qiblaDirection
    )}°)`;
  }
}

// Update compass (for desktop)
function updateCompass() {
  // For desktop, we'll just show the angle
  elements.compassArrow.style.transform = `translateX(-50%) rotate(${qiblaDirection}deg)`;
  elements.qiblaInfo.textContent = `Qibla direction: ${Math.round(
    qiblaDirection
  )}° from North`;
}

// Get direction from angle
function getDirectionFromAngle(angle) {
  const directions = [
    "North",
    "North-East",
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
  ];
  const index = Math.round((angle % 360) / 45) % 8;
  return directions[index];
}

// Fetch random Quran ayah
function fetchRandomAyah() {
  // In a real app, you would use the Quran API
  // For demo, we'll use a static response
  const randomAyahs = [
    {
      text: "وَٱللَّهُ يَهْدِى مَن يَشَآءُ إِلَىٰ صِرَٰطٍ مُّسْتَقِيمٍ",
      translation: "And Allah guides whom He wills to a straight path.",
      reference: "Quran 2:213",
    },
    {
      text: " إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ ۗ",
      translation: "Indeed, prayer prohibits immorality and wrongdoing.",
      reference: "Quran 29:45",
    },
    {
      text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      translation:
        "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.",
      reference: "Quran 2:201",
    },
  ];

  const ayah = randomAyahs[Math.floor(Math.random() * randomAyahs.length)];

  elements.ayahText.textContent = ayah.text;
  elements.ayahTranslation.textContent = ayah.translation;
  elements.ayahReference.textContent = ayah.reference;

  /*
            // Real API implementation would look like:
            fetch('https://api.alquran.cloud/v1/ayah/random/en.sahih')
                .then(response => response.json())
                .then(data => {
                    elements.ayahText.textContent = data.data.text;
                    elements.ayahTranslation.textContent = data.data.translation;
                    elements.ayahReference.textContent = `Quran ${data.data.surah.number}:${data.data.numberInSurah}`;
                })
                .catch(error => {
                    console.error("Error fetching ayah:", error);
                });
            */
}

// Fetch random Hadith
function fetchRandomHadith() {
  // In a real app, you would use a Hadith API
  // For demo, we'll use a static response
  const randomHadiths = [
    {
      text: "The best of you are those who learn the Quran and teach it.",
      reference: "Sahih al-Bukhari",
    },
    {
      text: "The most beloved of deeds to Allah are those that are most consistent, even if it is small.",
      reference: "Sahih al-Bukhari",
    },
    {
      text: "None of you truly believes until he loves for his brother what he loves for himself.",
      reference: "Sahih al-Bukhari",
    },
  ];

  const hadith =
    randomHadiths[Math.floor(Math.random() * randomHadiths.length)];

  elements.hadithText.textContent = hadith.text;
  elements.hadithReference.textContent = hadith.reference;
}

// Calculate Islamic events
function calculateIslamicEvents() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 5 = Friday

  // Next Jummah
  let daysUntilJummah = (5 - day + 7) % 7;
  if (daysUntilJummah === 0 && now.getHours() >= 12) {
    daysUntilJummah = 7; // If it's after Jummah time today, show next week
  }

  elements.jummahCountdown.textContent =
    daysUntilJummah === 0
      ? "Today"
      : daysUntilJummah === 1
      ? "Tomorrow"
      : `${daysUntilJummah} days`;

  // Eid al-Fitr (approximate)
  const ramadanEnd = new Date(now.getFullYear(), 3, 21); // April 21
  const diff = Math.ceil((ramadanEnd - now) / (1000 * 60 * 60 * 24));

  if (diff > 0) {
    elements.eidCountdown.textContent = `${diff} days`;
  } else {
    elements.eidCountdown.textContent = "Passed";
  }

  // Hajj (approximate)
  const hajjStart = new Date(now.getFullYear(), 6, 7); // July 7
  const hajjDiff = Math.ceil((hajjStart - now) / (1000 * 60 * 60 * 24));

  if (hajjDiff > 0) {
    elements.hajjCountdown.textContent = `${hajjDiff} days`;
  } else {
    elements.hajjCountdown.textContent = "Passed";
  }

  // Ramadan (approximate)
  const ramadanStart = new Date(now.getFullYear(), 2, 22); // March 22
  const ramadanDiff = Math.ceil((ramadanStart - now) / (1000 * 60 * 60 * 24));

  if (ramadanDiff > 0) {
    elements.ramadanCountdown.textContent = `${ramadanDiff} days`;
  } else {
    elements.ramadanCountdown.textContent = "Passed";
  }
}

// Set theme
function setTheme(theme) {
  document.body.className = `${theme}-theme`;

  // Update mosque background opacity based on theme
  const mosqueBg = document.querySelector(".mosque-bg");
  if (theme === "dark" || theme === "night") {
    mosqueBg.style.opacity = "0.1";
  } else {
    mosqueBg.style.opacity = "0.05";
  }

  // Update stars visibility
  const stars = document.querySelector(".stars");
  if (theme === "night") {
    stars.style.display = "block";
    createStars();
  } else {
    stars.style.display = "none";
  }
}

// Create stars for night theme
function createStars() {
  const starsContainer = document.querySelector(".stars");
  starsContainer.innerHTML = "";

  for (let i = 0; i < 100; i++) {
    const star = document.createElement("div");
    star.classList.add("star");

    // Random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    // Random size (1-3px)
    const size = Math.random() * 2 + 1;

    // Random animation duration (2-5s)
    const duration = Math.random() * 3 + 2;

    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.setProperty("--duration", `${duration}s`);

    starsContainer.appendChild(star);
  }
}

// Show loading spinner
function showLoading() {
  elements.loadingSpinner.classList.add("active");
}

// Hide loading spinner
function hideLoading() {
  elements.loadingSpinner.classList.remove("active");
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

function toggleThemeDropdown() {
  const dropdown = document.getElementById("theme-options");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}
