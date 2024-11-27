const loader = document.querySelector(".loader");
const searchAmount = document.querySelector(".search_amount");
const filterWrapper = document.querySelector(".sr_cata");
const typeFilterWrapper = document.querySelector(".type_cata");
const drWrapper = document.querySelector(".dr_wrapper"); // For Departure Ready and High Time Crew checkboxes
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
    let selectedDrFilters = []; // For departure ready filter
    let selectedHtcFilters = []; // For high time crew filter
    let searchText = "";
    let filteredItems = [...aircraftSets];
    let selectedYearRange = minYear;

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
      filteredItems = aircraftSets.filter((item) => {
        const matchesSearch = item.description_text
          .toLowerCase()
          .includes(searchText);
        const matchesClassFilter =
          selectedClassFilters.length === 0 ||
          selectedClassFilters.includes(item.class_text);
        const matchesTypeFilter =
          selectedTypeFilters.length === 0 ||
          selectedTypeFilters.includes(item.description_text);
        const matchesDepartureReady =
          selectedDrFilters.length === 0 ||
          selectedDrFilters.includes(item.departure_ready__boolean);
        const matchesHighTimeCrew =
          selectedHtcFilters.length === 0 ||
          selectedHtcFilters.includes(item.high_time_crew__boolean);
        const matchesYearRange =
          item.year_of_manufacture_number >= selectedYearRange;
        return (
          matchesSearch &&
          matchesClassFilter &&
          matchesTypeFilter &&
          matchesDepartureReady &&
          matchesHighTimeCrew &&
          matchesYearRange
        );
      });
      updateSearchAmount();
      currentPage = 1;
      renderPage(currentPage);
      // updateCheckboxes();
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
    };

    const renderDrFilters = () => {
      // Departure Ready Filter (departure_ready__boolean) only for true
      const departureReadyCounts = filteredItems.reduce((acc, item) => {
        if (item.departure_ready__boolean === true) {
          acc.true = (acc.true || 0) + 1;
        }
        return acc;
      }, {});

      drWrapper.innerHTML = ""; // Clear previous filters

      // Departure Ready Checkbox (only true)
      if (departureReadyCounts.true > 0) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = true;
        checkbox.id = `filter-departure-ready-true`;

        const label = document.createElement("label");
        label.htmlFor = `filter-departure-ready-true`;
        label.textContent = `Departure Ready (${departureReadyCounts.true})`;

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            selectedDrFilters.push(true);
          } else {
            selectedDrFilters = selectedDrFilters.filter(
              (filter) => filter !== true
            );
          }
          applyFilters();
        });

        const div = document.createElement("div");
        div.classList.add("checkboxWrapper");
        div.appendChild(checkbox);
        div.appendChild(label);
        drWrapper.appendChild(div);
      }

      // High Time Crew Filter (high_time_crew__boolean) only for true
      const highTimeCrewCounts = filteredItems.reduce((acc, item) => {
        if (item.high_time_crew__boolean === true) {
          acc.true = (acc.true || 0) + 1;
        }
        return acc;
      }, {});

      // High Time Crew Checkbox (only true)
      if (highTimeCrewCounts.true > 0) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = true;
        checkbox.id = `filter-high-time-crew-true`;

        const label = document.createElement("label");
        label.htmlFor = `filter-high-time-crew-true`;
        label.textContent = `High Time Crew (${highTimeCrewCounts.true})`;

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            selectedHtcFilters.push(true);
          } else {
            selectedHtcFilters = selectedHtcFilters.filter(
              (filter) => filter !== true
            );
          }
          applyFilters();
        });

        const div = document.createElement("div");
        div.classList.add("checkboxWrapper");
        div.appendChild(checkbox);
        div.appendChild(label);
        drWrapper.appendChild(div);
      }
    };

    slider.addEventListener("input", () => {
      selectedYearRange = parseInt(slider.value);
      rangeValueElement.textContent = selectedYearRange;
      applyFilters();

      // After applying filters, log the updated checkbox counts
      const classCounts = filteredItems.reduce((acc, item) => {
        acc[item.class_text] = (acc[item.class_text] || 0) + 1;
        return acc;
      }, {});
      console.log("Class Filter Counts:", classCounts);

      const typeCounts = filteredItems.reduce((acc, item) => {
        acc[item.description_text] = (acc[item.description_text] || 0) + 1;
        return acc;
      }, {});
      console.log("Type Filter Counts:", typeCounts);

      const departureReadyCounts = filteredItems.reduce((acc, item) => {
        if (item.departure_ready__boolean === true) {
          acc.true = (acc.true || 0) + 1;
        }
        return acc;
      }, {});
      console.log("Departure Ready Filter Counts:", departureReadyCounts);

      const highTimeCrewCounts = filteredItems.reduce((acc, item) => {
        if (item.high_time_crew__boolean === true) {
          acc.true = (acc.true || 0) + 1;
        }
        return acc;
      }, {});
      console.log("High Time Crew Filter Counts:", highTimeCrewCounts);
    });

    // Event listener for search input
    searchInput.addEventListener("input", () => {
      searchText = searchInput.value.toLowerCase();
      applyFilters();
    });

    // Initial rendering
    renderFilters();
    renderDrFilters();
    applyFilters();
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
    hideLoader();
  });
