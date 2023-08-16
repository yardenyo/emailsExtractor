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

  let processIsRunning = false;
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

  // Function to populate table data
  async function populateTable(page) {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "getBlacklistData"
      );

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

      prevPageButton.disabled = page === 1;
      nextPageButton.disabled = endIndex >= result.length;
    } catch (error) {
      throw error;
    }
  }

  // Initial setup
  submitButton.disabled = false;
  stopButton.disabled = true;
  populateFormFromEnvFile();
  populateTable(currentPage);

  // Event listener for emails to send
  window.electron.ipcRenderer.on("emailsToSend", (event, emailsToSend) => {
    emailsToSend.forEach((email) => {
      const newRow = successTable.insertRow();
      const emailCell = newRow.insertCell(0);
      const dateCell = newRow.insertCell(1);

      emailCell.textContent = email;
      dateCell.textContent = new Date().toLocaleString();
    });
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

      try {
        await window.electron.ipcRenderer.invoke(
          "writeToEnvFile",
          envFileContent
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
    };

    try {
      processIsRunning = true;
      submitButton.disabled = true;
      stopButton.disabled = false;
      await window.electron.ipcRenderer.invoke("start", payload);
    } catch (error) {
      throw error;
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
