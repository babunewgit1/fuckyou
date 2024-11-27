const loader = document.querySelector(".loader");
const searchAmount = document.querySelector(".search_amount");
const filterWrapper = document.querySelector(".sr_cata");
const typeFilterWrapper = document.querySelector(".type_cata");
const departureReadyWrapper = document.querySelector(".dr_check");
const highTimeCrewWrapper = document.querySelector(".htc_check");
const sellersFilterWrapper = document.querySelector(".sellers_cata");
const searchInput = document.querySelector(".sr_input");
const wrapper = document.querySelector(".searchbody_wrapper");
const paginationWrapper = document.querySelector(".pagination");
const rangeValueElement = document.querySelector("#rangevalue");
const slider = document.getElementById("rangeSlider");

const itemsPerPage = 5; // Number of items to display per page

const showLoader = () => {
  loader.classList.add("active");
};

const hideLoader = () => {
  loader.classList.remove("active");
};

const oneWayData = JSON.parse(sessionStorage.getItem("one_way"));

const data = {
  "from airport id": oneWayData.fromId,
  "to airport id": oneWayData.toId,
  date_as_text: oneWayData.dateAsText,
  time_as_text: oneWayData.timeAsText,
  App_Out_Date_As_Text: oneWayData.appDate,
  pax: oneWayData.pax,
  date: oneWayData.timeStamp,
};

showLoader();

fetch("https://jettly.com/api/1.1/wf/webflow_one_way_flight", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((apiData) => {
    hideLoader();

    const aircraftSets = [];
    if (apiData.response) {
      for (const key in apiData.response) {
        if (key.startsWith("aircraft_set_")) {
          aircraftSets.push(...apiData.response[key]);
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const minYear = Math.min(
      ...aircraftSets
        .map((item) => item.year_of_manufacture_number)
        .filter((year) => !isNaN(year))
    );

    slider.min = minYear;
    slider.max = currentYear;
    slider.value = minYear; // Set the slider to the min year initially
    rangeValueElement.textContent = minYear; // Display the initial slider value

    let currentPage = 1;
    let selectedClassFilters = [];
    let selectedTypeFilters = [];
    let selectedSellersFilters = [];
    let searchText = "";
    let filteredItems = [...aircraftSets]; // Initial list of all items
    let departureReadyFilter = false;
    let highTimeCrewFilter = false;
    let selectedYearRange = minYear;

    // Store all items for range filtering
    let rangeFilteredItems = [...aircraftSets];

    const totalPages = () => Math.ceil(filteredItems.length / itemsPerPage);

    const updateSearchAmount = () => {
      searchAmount.textContent = filteredItems.length;
    };

    const renderPage = (page) => {
      wrapper.innerHTML = "";
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const itemsToDisplay = filteredItems.slice(startIndex, endIndex);
      itemsToDisplay.forEach((item) => {
        wrapper.innerHTML += `
          <div class="item_wrapper">
            <div class="item_left">
              <img src="${item.exterior_image1_image}" alt="" />
            </div>
            <div class="item_right">
              <h2>${item.description_text}</h2>
            </div>
          </div>
        `;
      });
      renderPagination();
    };

    const renderPagination = () => {
      paginationWrapper.innerHTML = "";
      const pages = totalPages();
      for (let i = 1; i <= pages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.className = i === currentPage ? "active" : "";
        button.addEventListener("click", () => {
          currentPage = i;
          renderPage(currentPage);
        });
        paginationWrapper.appendChild(button);
      }
    };

    const applyFilters = () => {
      let tempFilteredItems = rangeFilteredItems; // Start from range filtered items

      // Apply text search filter
      if (searchText) {
        tempFilteredItems = tempFilteredItems.filter((item) =>
          item.description_text.toLowerCase().includes(searchText)
        );
      }

      // Apply class filter
      if (selectedClassFilters.length > 0) {
        tempFilteredItems = tempFilteredItems.filter((item) =>
          selectedClassFilters.includes(item.class_text)
        );
      }

      // Apply type filter
      if (selectedTypeFilters.length > 0) {
        tempFilteredItems = tempFilteredItems.filter((item) =>
          selectedTypeFilters.includes(item.description_text)
        );
      }

      // Apply Departure Ready filter
      if (departureReadyFilter) {
        tempFilteredItems = tempFilteredItems.filter(
          (item) => item.departure_ready__boolean === true
        );
      }

      // Apply High Time Crew filter
      if (highTimeCrewFilter) {
        tempFilteredItems = tempFilteredItems.filter(
          (item) => item.high_time_crew__boolean === true
        );
      }

      // Apply Sellers filter
      if (selectedSellersFilters.length > 0) {
        tempFilteredItems = tempFilteredItems.filter((item) =>
          selectedSellersFilters.includes(item.operator_txt_text)
        );
      }

      filteredItems = tempFilteredItems; // Update the filtered items
      updateSearchAmount();
      currentPage = 1; // Reset to the first page
      renderPage(currentPage); // Render the new page
      renderFilters(); // Update the filter labels with new counts
    };

    const renderFilters = () => {
      // Class Filters
      const classCounts = filteredItems.reduce((acc, item) => {
        acc[item.class_text] = (acc[item.class_text] || 0) + 1;
        return acc;
      }, {});

      filterWrapper.innerHTML = "";
      Object.entries(classCounts).forEach(([classText, count]) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = classText;
        checkbox.id = `filter-${classText}`;

        const label = document.createElement("label");
        label.htmlFor = `filter-${classText}`;
        label.textContent = `${classText} (${count})`;

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            selectedClassFilters.push(classText);
          } else {
            selectedClassFilters = selectedClassFilters.filter(
              (filter) => filter !== classText
            );
          }
          applyFilters();
        });

        const div = document.createElement("div");
        div.classList.add("checkboxWrapper");
        div.appendChild(checkbox);
        div.appendChild(label);
        filterWrapper.appendChild(div);
      });

      // Type Filters (Description Text)
      const typeCounts = filteredItems.reduce((acc, item) => {
        acc[item.description_text] = (acc[item.description_text] || 0) + 1;
        return acc;
      }, {});

      typeFilterWrapper.innerHTML = "";
      Object.entries(typeCounts).forEach(([descriptionText, count]) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = descriptionText;
        checkbox.id = `filter-type-${descriptionText}`;

        const label = document.createElement("label");
        label.htmlFor = `filter-type-${descriptionText}`;
        label.textContent = `${descriptionText} (${count})`;

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            selectedTypeFilters.push(descriptionText);
          } else {
            selectedTypeFilters = selectedTypeFilters.filter(
              (filter) => filter !== descriptionText
            );
          }
          applyFilters();
        });

        const div = document.createElement("div");
        div.classList.add("checkboxWrapper");
        div.appendChild(checkbox);
        div.appendChild(label);
        typeFilterWrapper.appendChild(div);
      });

      // Sellers Filters (Operators)
      const sellersCounts = filteredItems.reduce((acc, item) => {
        acc[item.operator_txt_text] = (acc[item.operator_txt_text] || 0) + 1;
        return acc;
      }, {});

      sellersFilterWrapper.innerHTML = "";
      Object.entries(sellersCounts).forEach(([operatorText, count]) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = operatorText;
        checkbox.id = `filter-seller-${operatorText}`;

        const label = document.createElement("label");
        label.htmlFor = `filter-seller-${operatorText}`;
        label.textContent = `${operatorText} (${count})`;

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            selectedSellersFilters.push(operatorText);
          } else {
            selectedSellersFilters = selectedSellersFilters.filter(
              (filter) => filter !== operatorText
            );
          }
          applyFilters();
        });

        const div = document.createElement("div");
        div.classList.add("checkboxWrapper");
        div.appendChild(checkbox);
        div.appendChild(label);
        sellersFilterWrapper.appendChild(div);
      });
    };

    // Initial render of filters and items
    renderFilters();
    applyFilters();

    // Search Input
    searchInput.addEventListener("input", (e) => {
      searchText = e.target.value.toLowerCase();
      applyFilters();
    });

    // Range Slider Change
    slider.addEventListener("input", () => {
      selectedYearRange = parseInt(slider.value);
      rangeValueElement.textContent = slider.value;

      // Filter items based on selected range
      rangeFilteredItems = aircraftSets.filter((item) => {
        return item.year_of_manufacture_number >= selectedYearRange;
      });

      applyFilters(); // Update filtered items when slider value changes
    });
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
    hideLoader();
  });
