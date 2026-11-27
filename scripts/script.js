/* CONFIG */
const preloaderWaitindTime = 1200;
const cardsOnPage = 5;
const BASE_URL = 'https://v-content.ffapi.ru';
const endpoint = `${BASE_URL}/api/videos?pagination[pageSize]=${cardsOnPage}&`;
/* PAGE ELEMENTS */
const cardsContainer = document.querySelector('.content__list');
const videoContainer = document.querySelector('.result__video-container');
const videoElement = document.querySelector('.result__video');
const form = document.querySelector('form');
/* TEMPLATES */
const cardTmp = document.querySelector('.cards-list-item-template');
const preloaderTmp = document.querySelector('.preloader-template');
const videoNotFoundTmp = document.querySelector('.error-template');
const moreButtonTmp = document.querySelector('.more-button-template');

// For toggles
let cardsOnPageState = [];
// Initial load 
showPreloader(preloaderTmp, videoContainer);
showPreloader(preloaderTmp, cardsContainer);
mainMechanics(endpoint);

// Search 
form.onsubmit = (e) => {
  e.preventDefault();
  cardsContainer.textContent = '';
  [...videoContainer.children].forEach((el) => {
    el.className === 'error' && el.remove();
  });
  showPreloader(preloaderTmp, videoContainer);
  showPreloader(preloaderTmp, cardsContainer);
  const formData = serializeFormData(form);
  const requestUrl = generateFilterRequest(
    endpoint,
    formData.city,
    formData.timeArray
  );
  mainMechanics(requestUrl);
};

/* FUNCTION THAT GENERATES EVERYTHING */
async function mainMechanics(endpoint) {
  try{
    const data = await (await fetch(endpoint)).json();
    cardsOnPageState = data.results;
    if(!data?.results?.[0]) throw new Error('not-found');
    appendCards({
      baseUrl: BASE_URL,
      dataArray: data.results,
      cardTmp,
      container: cardsContainer,
    });
    setVideo({
      baseUrl: BASE_URL,
      video: videoElement,
      videoUrl: data.results[0].video.url,
      posterUrl: data.results[0].poster.url,
    });
    document.querySelectorAll('.content__card-link')[0].classList.add('content__card-link_current');
    await waitForReadyVideo(videoElement);
    await delay(preloaderWaitindTime);
    removePreloader(videoContainer, '.preloader');
    removePreloader(cardsContainer, '.preloader');
    chooseCurrentVideo({
      baseUrl: BASE_URL,
      videoData: cardsOnPageState,
      cardLinksSelector: '.content__card-link',
      currentLinkClassName: 'content__card-link_current',
      mainVideo: videoElement,
    });

    showMoreCards({
      dataArray: data,
      buttonTemplate: moreButtonTmp,
      cardsContainer,
      buttonSelector: '.more-button',
      initialEndpoint: endpoint,
      baseUrl: BASE_URL,
      cardTmp: cardTmp,
    });
  } catch(err) {
    if(err.message === 'not-found') showError(videoContainer, videoNotFoundTmp, 'Нет подходящих видео =(');
    else showError(videoContainer, videoNotFoundTmp, 'Ошибка получения данных :(');
    console.log(err);
    removePreloader(videoContainer, '.preloader');
    removePreloader(cardsContainer, '.preloader');
  }
}

/* UTILITIES */
// Simple promise to make pausing easier
async function delay(ms) {
  return await new Promise((resolve) => { return setTimeout(resolve, ms); });
}

// Promise that resolves when the video is entirely ready to play without pauses
async function waitForReadyVideo(video) {
  return await new Promise((resolve) => { video.oncanplaythrough = resolve; });
}

// Sets preloader during data loading ✅
function showPreloader(tmp, parent) {
  const node = tmp.content.cloneNode(true);
  parent.append(node);
  console.log('showed preloader');
}

// Removes preloader from DOM ✅
function removePreloader(parent, preloaderSelector) {
  const preloader = parent.querySelector(preloaderSelector);
  if(preloader) preloader.remove();
  console.log('removed preloader');
}

// Adds cards to container, assembling them from API data ✅
function appendCards({ baseUrl, dataArray, cardTmp, container }) {
  dataArray.forEach((el) => {
    const node = cardTmp.content.cloneNode(true);
    node.querySelector('a').setAttribute('id', el.id);
    node.querySelector('.content__video-card-title').textContent = el.city;
    node.querySelector('.content__video-card-description').textContent = el.description;
    node.querySelector('.content__video-card-thumbnail').setAttribute('src', `${baseUrl}${el.thumbnail.url}`);
    node.querySelector('.content__video-card-thumbnail').setAttribute('alt', el.description);
    container.append(node);
  });
  console.log('Generated cards');
}

// Sets the desired video into the container ✅
function setVideo({ baseUrl, video, videoUrl, posterUrl }) {
  video.setAttribute('src', `${baseUrl}${videoUrl}`);
  video.setAttribute('poster', `${baseUrl}${posterUrl}`);
  console.log('Inserted video into main block');
}

// Gets data from form and serializes it as needed ✅

function serializeFormData(form) {
  const city = form.querySelector('input[name="city"]');
  const checkboxes = form.querySelectorAll('input[name="time"]');
  const checkedValuesArray = [...checkboxes].reduce((acc, item) => {
    item.checked && acc.push(item.value);
    return acc;
  }, []);
  console.log('Collected form data into object');
  return {
    city: city.value,
    timeArray: checkedValuesArray,
  };
}

// Generates API query filter string based on form data ✅
function generateFilterRequest(endpoint, city, timeArray) {
  if(city) {
    endpoint += `filters[city][$containsi]=${city}&`;
  }
  if(timeArray) {
    timeArray.forEach((timeslot) => {
      endpoint += `filters[time_of_day][$eqi]=${timeslot}&`;
    });
  }
  console.log('Generated API request URL string from form data');
  return endpoint;
}

// Switches current video ✅
function chooseCurrentVideo({
  baseUrl,
  videoData,
  cardLinksSelector,
  currentLinkClassName,
  mainVideo,
}) {
  const cardsList = document.querySelectorAll(cardLinksSelector);
  if(cardsList) {
    cardsList.forEach((item) => {
      item.onclick = async (e) => {
        e.preventDefault();
        cardsList.forEach((item) => {
          item.classList.remove(currentLinkClassName);
        });
        item.classList.add(currentLinkClassName);
        showPreloader(preloaderTmp, videoContainer);
        const vidoObj = videoData.find(
          (video) => String(video.id) === String(item.id)
        );
        setVideo({
          baseUrl,
          video: mainVideo,
          videoUrl: vidoObj.video.url,
          posterUrl: vidoObj.poster.url,
        });
        await waitForReadyVideo(mainVideo);
        await delay(preloaderWaitindTime);
        removePreloader(videoContainer, '.preloader');
        console.log('Switched video');
      };
    });
  }
}

// Renders interface when video is not found
function showError(container, errorTemplate, errorMessage) {
  const node = errorTemplate.content.cloneNode(true);
  node.querySelector('.error__title').textContent = errorMessage;
  container.append(node);
  console.log('showed error');
}

// Renders more video if pagination has more pages than shown
function showMoreCards({
  dataArray,
  buttonTemplate,
  cardsContainer,
  buttonSelector,
  initialEndpoint,
  baseUrl,
  cardTmp,
}) {
  if(dataArray.pagination.page === dataArray.pagination.pageCount) return;
  // Add button from template to the end of the cards list
  const button = buttonTemplate.content.cloneNode(true);
  cardsContainer.append(button);
  // Select the added element by selector and add a click listener
  const buttonInDOM = cardsContainer.querySelector(buttonSelector);
  buttonInDOM.addEventListener('click', async () => {
    // Request data for the next page on click
    let currentPage = dataArray.pagination.page;
    let urlToFetch = `${initialEndpoint}pagination[page]=${(currentPage += 1)}&`;
    try{
      let data = await (await fetch(urlToFetch)).json();
      buttonInDOM.remove();
      cardsOnPageState = cardsOnPageState.concat(data.results);
      appendCards({
        baseUrl,
        dataArray: data.results,
        cardTmp,
        container: cardsContainer,
      });
      chooseCurrentVideo({
        baseUrl: BASE_URL,
        videoData: cardsOnPageState,
        cardLinksSelector: '.content__card-link',
        currentLinkClassName: 'content__card-link_current',
        mainVideo: videoElement,
      });
      showMoreCards({
        dataArray: data,
        buttonTemplate,
        cardsContainer,
        buttonSelector,
        initialEndpoint,
        baseUrl,
        cardTmp,
      });
    } catch(err) {
      return err;
    }
  });
}