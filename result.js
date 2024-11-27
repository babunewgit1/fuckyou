const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const id = params.get("id");
console.log(id);

const formWrapper = document.querySelector(".custom");

let flightDataArray = [];
let isLoading = true; // Loading state

const apiUrl = `https://jettly.com/api/1.1/obj/flightrequest/${id}`;

async function fetchFlightData() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    flightDataArray.push(
      ...data.response.saved_aircraft_search_results_list_custom_aircraft
    );
  } catch (error) {
    console.error("Error fetching the API:", error);
  } finally {
    isLoading = false; // Set loading to false after fetching
    checkLoadingState(); // Check loading state after fetch
  }
}

function checkLoadingState() {
  if (!isLoading) {
    flightDataArray.forEach((item) => {
      formWrapper.innerHTML += `<label class="w-checkbox"><input type="checkbox" id="${item}" name="${item}" data-name="Checkbox 2" class="w-checkbox-input"><span fs-cmsfilter-field="IDENTIFIER" class="w-form-label" for="${item}">${item}</span></label>`;
    });
  }
}

fetchFlightData();
