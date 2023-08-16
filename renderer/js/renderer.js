document.addEventListener("DOMContentLoaded", () => {
  const emailForm = document.getElementById("email-form");
  const successTable = document
    .getElementById("success-table")
    .getElementsByTagName("tbody")[0];
  const submitButton = document.getElementById("submit-button");
  const stopButton = document.getElementById("stop-button");
  let processIsRunning = false;

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

  async function populateTable() {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "getBlacklistData"
      );

      result.forEach((entry) => {
        const newRow = successTable.insertRow();
        const emailCell = newRow.insertCell(0);
        const dateCell = newRow.insertCell(1);

        emailCell.textContent = entry.email;
        dateCell.textContent = new Date(entry.date).toLocaleString();
      });
    } catch (error) {
      throw error;
    }
  }

  submitButton.disabled = false;
  stopButton.disabled = true;

  populateFormFromEnvFile();

  populateTable();

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
      cvFile,
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

  stopButton.addEventListener("click", async () => {
    if (!processIsRunning) {
      return;
    }
    try {
      await window.electron.ipcRenderer.invoke("stop");
    } catch (error) {
      throw error;
    } finally {
      processIsRunning = false;
      submitButton.disabled = false;
      stopButton.disabled = true;
    }
  });
});
