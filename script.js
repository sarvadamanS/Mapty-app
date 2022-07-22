'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteBtn = document.querySelector('.delete__btn');
const updateBtn = document.querySelector('.update__btn');
const showAllBtn = document.querySelector('.showAll__btn');

//Modal
const modal = document.getElementById('myModal');
const modalText = document.querySelector('.message');
// Get the <span> element that closes the modal
const span = document.getElementsByClassName('close')[0];

class workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  calcDescription() {
    // prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return (this.description = `${
      this.type.slice(0, 1).toUpperCase() + this.type.slice(1)
    } on ${months[this.date.getMonth()]} ${this.date.getDate()}`);
  }
}
const work = new workout(12, 33, [13, 313]);
class running extends workout {
  type = 'running';
  constructor(distance, duration, coords, cadence, pace) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this.calcDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class cycling extends workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain, speed) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.calcDescription();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}
const cycle = new cycling(200, 10, [13, 53], 500);

class App {
  #map;
  #mapEvent;
  #targetELClick;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    containerWorkouts.addEventListener(
      'dblclick',
      this._editWorkout.bind(this)
    );
    deleteBtn.addEventListener('click', this.reset.bind(this));
    updateBtn.addEventListener('click', this._editingFunctionality.bind(this));
    showAllBtn.addEventListener('click', this._showAllWorkoutOnMap.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log(`Error getting your location`);
        }
      );
    }
  }
  _loadMap(location) {
    // console.log(location);
    const { latitude, longitude } = location.coords;
    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    if (!this.#workouts) return;
    this.#workouts.forEach(work => {
      this._renderMarker(work);
    });
    //   console.log(, longitude);
    //   console.log(`https://www.google.com/maps/@${latitude},${longitude},13z`);
  }
  _showAllWorkoutOnMap() {
    const wasp = this.#workouts;
    let [...coordsFilter] = this.#workouts.map(work => work.coords);
    console.log(coordsFilter);
    const bounds = L.latLngBounds(coordsFilter);
    console.log(bounds);
    this.#map.fitBounds(bounds);
  }

  _editWorkout(e) {
    console.log(e.target);
    if (e.target.classList.contains('workout--deleteBtn'))
      return this._deleteCurrentWorkout(e);
    form.classList.remove('hidden');
    inputDistance.focus();
    console.log(e.target);
    const clickTarget = e.target.closest('.workout');
    this.#targetELClick = this.#workouts.find(
      work => work.id === clickTarget.dataset.id
    );
    updateBtn.classList.remove('hidden');
    // console.log(this.#targetELClick);
  }
  _editingFunctionality() {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const positveNumbers = (...inputs) => inputs.every(inp => inp > 0);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    if (this.#targetELClick.type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInputs(distance, duration, cadence))
        return this._errorMessage();
      if (!positveNumbers(distance, duration, cadence))
        return this._errorMessage();
      this.#targetELClick.distance = distance;
      this.#targetELClick.duration = duration;
      this.#targetELClick.cadence = cadence;
      console.log(this.#targetELClick);
      console.log(this.#workouts);

      // this.#workouts.push(workout);
    }
    if (this.#targetELClick.type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !positveNumbers(distance, duration)
      )
        return this._errorMessage();
      this.#targetELClick.distance = distance;
      this.#targetELClick.duration = duration;
      this.#targetELClick.elevationGain = elevation;
    }
    updateBtn.classList.add('hidden');
    this._hideForm();
    this._setLocalStorage();
    location.reload();
  }
  _deleteCurrentWorkout(e) {
    console.log(`cross clicked`);
    const clickTarget = e.target.closest('.workout');
    const targetELClick = this.#workouts.find(
      work => work.id === clickTarget.dataset.id
    );
    const index = this.#workouts.indexOf(targetELClick);
    this.#workouts.splice(index, 1);
    this._setLocalStorage();
    location.reload();
  }
  _errorMessage() {
    modal.style.display = 'block';
    modalText.textContent = `Only postive numbers should be input`;
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    // console.log(this.#mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _newWorkout(e) {
    e.preventDefault();
    if (!updateBtn.classList.contains('hidden')) return;
    const { lat, lng } = this.#mapEvent.latlng;
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const positveNumbers = (...inputs) => inputs.every(inp => inp > 0);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInputs(distance, duration, cadence))
        return this._errorMessage();
      if (!positveNumbers(distance, duration, cadence))
        return this._errorMessage();
      workout = new running(distance, duration, [lat, lng], cadence);
      // console.log(workout);
      this.#workouts.push(workout);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !positveNumbers(distance, duration)
      )
        return this._errorMessage();
      workout = new cycling(distance, duration, [lat, lng], elevation);
      // console.log(workout);
      this.#workouts.push(workout);
    }
    this._setLocalStorage();
    this._renderMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
  }
  _moveToPopup(e) {
    if (!this.#map) return;
    const clickEl = e.target.closest('.workout');
    if (!clickEl) return;
    // console.log(clickEl.dataset.id);
    const clickID = this.#workouts.find(el => el.id === clickEl.dataset.id);
    // console.log(clickID.coords);

    this.#map.setView(clickID.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
    // localStorage.removeItem('workout')
  }
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }
  _renderMarker(workout) {
    // console.log(workout, this);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2> 
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div> 
          <button type="button" class="workout--deleteBtn">Delete
      </button>
          </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();

span.onclick = function () {
  modal.style.display = 'none';
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};
