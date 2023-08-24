document.addEventListener("DOMContentLoaded", () => {
  const emailForm = document.getElementById("email-form");
  const successTable = document
    .getElementById("success-table")
    .getElementsByTagName("tbody")[0];
  const submitButton = document.getElementById("submit-button");
  const stopButton = document.getElementById("stop-button");
  const confirmationModal = document.getElementById("confirmation-modal");
  const confirmStopButton = document.getElementById("confirm-stop");
  const cancelStopButton = document.getElementById("cancel-stop");
  const prevPageButton = document.getElementById("prev-page");
  const nextPageButton = document.getElementById("next-page");
  const delayInput = document.getElementById("automation-time");
  const delayUnitSelect = document.getElementById("automation-unit");

  let processIsRunning = false;
  let intervalId = null;
  let currentPage = 1;
  const itemsPerPage = 10;

  // Function to populate form fields from environment file
  async function populateFormFromEnvFile() {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "getEnvFileContent"
      );

      if (result.length > 0) {
        const envFileContent = result.split("\n");

        const linkedinEmail = envFileContent[0].split("=")[1].replace(/"/g, "");
        const linkedinPassword = envFileContent[1]
          .split("=")[1]
          .replace(/"/g, "");
        const gmailEmail = envFileContent[2].split("=")[1].replace(/"/g, "");
        const gmailPassword = envFileContent[3].split("=")[1].replace(/"/g, "");
        const scrolls = envFileContent[4].split("=")[1].replace(/"/g, "");

        document.getElementById("linkedin-email").value = linkedinEmail;
        document.getElementById("linkedin-password").value = linkedinPassword;
        document.getElementById("gmail-email").value = gmailEmail;
        document.getElementById("gmail-password").value = gmailPassword;
        document.getElementById("scroll-count").value = scrolls;
      } else {
        document.getElementById("linkedin-email").value = "";
        document.getElementById("linkedin-password").value = "";
        document.getElementById("gmail-email").value = "";
        document.getElementById("gmail-password").value = "";
        document.getElementById("scroll-count").value = "";
      }
    } catch (error) {
      throw error;
    }
  }

  // Function to populate email content from file
  async function populateEmailContent() {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "getEmailFileContent"
      );

      if (result.length > 0) {
        const emailContent = JSON.parse(result);

        const subject = emailContent[0].subject;
        const body = emailContent[0].body;

        document.getElementById("email-subject").value = subject;
        document.getElementById("email-body").value = body;
      } else {
        document.getElementById("email-subject").value = "";
        document.getElementById("email-body").value = "";
      }
    } catch (error) {
      throw error;
    }
  }

  // Function to populate table data
  async function populateTable(page) {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "getBlacklistData"
      );
      const totalResults = result.length;

      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      successTable.innerHTML = "";

      for (let i = startIndex; i < endIndex && i < result.length; i++) {
        const entry = result[i];
        const newRow = successTable.insertRow();
        const emailCell = newRow.insertCell(0);
        const dateCell = newRow.insertCell(1);

        emailCell.textContent = entry.email;
        dateCell.textContent = new Date(entry.date).toLocaleString();
      }

      updatePaginationInfo(page, totalResults);

      prevPageButton.disabled = page === 1;
      nextPageButton.disabled = endIndex >= result.length;

      const pageButtonsContainer = document.getElementById("page-buttons");
      pageButtonsContainer.innerHTML = "";

      for (let i = 1; i <= Math.ceil(totalResults / itemsPerPage); i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        pageButton.className = "page-index-button";
        if (i === page) {
          pageButton.classList.add("current-page");
        }
        pageButton.addEventListener("click", () => {
          currentPage = i;
          populateTable(currentPage);
        });
        pageButtonsContainer.appendChild(pageButton);
      }
    } catch (error) {
      throw error;
    }
  }

  function updatePaginationInfo(page, totalResults) {
    const paginationInfo = document.getElementById("pagination-info");
    paginationInfo.textContent = `Displaying ${
      (page - 1) * itemsPerPage + 1
    } - ${Math.min(
      page * itemsPerPage,
      totalResults
    )} of ${totalResults} results`;
  }

  function calculateDelay(time, unit) {
    if (unit === "minutes") {
      return time * 60 * 1000;
    } else if (unit === "hours") {
      return time * 60 * 60 * 1000;
    }

    return 0;
  }

  async function startProcess(payload, delayInMs = 0) {
    try {
      processIsRunning = true;
      submitButton.disabled = true;
      stopButton.disabled = false;

      intervalId = setInterval(async () => {
        try {
          await window.electron.ipcRenderer.invoke("start", payload);
        } catch (error) {
          throw error;
        }
      }, delayInMs);
    } catch (error) {
      throw error;
    }
  }

  // Initial setup
  submitButton.disabled = false;
  stopButton.disabled = true;
  populateFormFromEnvFile();
  populateEmailContent();
  populateTable(currentPage);

  // Event listener for emails to send
  window.electron.ipcRenderer.on(
    "emailsToSend",
    async (event, emailsToSend) => {
      emailsToSend.forEach((email) => {
        const newRow = successTable.insertRow();
        const emailCell = newRow.insertCell(0);
        const dateCell = newRow.insertCell(1);

        emailCell.textContent = email;
        dateCell.textContent = new Date().toLocaleString();
      });
    }
  );

  window.electron.ipcRenderer.on("stopProcess", async () => {
    processIsRunning = false;
    submitButton.disabled = false;
    stopButton.disabled = true;
  });

  // Event listener for form submission
  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (processIsRunning) {
      return;
    }

    const saveCredentials = document.getElementById("save-credentials");
    const linkedinEmail = document.getElementById("linkedin-email").value;
    const linkedinPassword = document.getElementById("linkedin-password").value;
    const gmailEmail = document.getElementById("gmail-email").value;
    const gmailPassword = document.getElementById("gmail-password").value;
    const cvFile = document.getElementById("cv-upload").files[0];
    const scrolls = document.getElementById("scroll-count").value;
    const subject = document.getElementById("email-subject").value;
    const body = document.getElementById("email-body").value;

    let cvName = "";
    let cvPath = "";

    if (cvFile) {
      const cvData = {
        name: cvFile.name,
        path: cvFile.path,
      };

      const { returnedCVName, returnedCVPath } =
        await window.electron.ipcRenderer.invoke("uploadCV", cvData);

      cvName = returnedCVName;
      cvPath = returnedCVPath;
    }

    if (saveCredentials.checked) {
      const envFileContent = `LINKEDIN_EMAIL=${linkedinEmail}\nLINKEDIN_PASSWORD=${linkedinPassword}\nGMAIL_EMAIL=${gmailEmail}\nGMAIL_PASSWORD=${gmailPassword}\nSCROLLS=${scrolls}`;

      const emailFileContent = [{ subject, body }];

      try {
        await window.electron.ipcRenderer.invoke(
          "writeToEnvFile",
          envFileContent
        );
        await window.electron.ipcRenderer.invoke(
          "writeToEmailContentFile",
          emailFileContent
        );
      } catch (error) {
        throw error;
      }
    } else {
      try {
        await window.electron.ipcRenderer.invoke("writeToEnvFile", "");
        populateFormFromEnvFile();
      } catch (error) {
        throw error;
      }
    }

    const payload = {
      linkedinEmail,
      linkedinPassword,
      gmailEmail,
      gmailPassword,
      cvName,
      cvPath,
      scrolls,
      subject,
      body,
    };

    const delay = parseInt(delayInput.value);
    const unit = delayUnitSelect.value;
    const delayInMs = calculateDelay(delay, unit);

    console.log("Delay in ms:", delayInMs);

    if (delayInMs > 0) {
      startProcess(payload, delayInMs);
    } else {
      startProcess(payload);
    }
  });

  // Event listener for stop button
  stopButton.addEventListener("click", () => {
    confirmationModal.style.display = "block";
  });

  // Event listener for confirming stop
  confirmStopButton.addEventListener("click", async () => {
    try {
      await window.electron.ipcRenderer.invoke("stop");
    } catch (error) {
      console.error("Error stopping the process:", error);
    } finally {
      processIsRunning = false;
      submitButton.disabled = false;
      stopButton.disabled = true;
      confirmationModal.style.display = "none";
    }
  });

  // Event listener for canceling stop
  cancelStopButton.addEventListener("click", () => {
    confirmationModal.style.display = "none";
  });

  // Event listener for previous page
  prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      populateTable(currentPage);
    }
  });

  // Event listener for next page
  nextPageButton.addEventListener("click", () => {
    currentPage++;
    populateTable(currentPage);
  });
});
