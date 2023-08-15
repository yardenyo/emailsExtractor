document.addEventListener("DOMContentLoaded", () => {
  const emailForm = document.getElementById("email-form");
  const successTable = document
    .getElementById("success-table")
    .getElementsByTagName("tbody")[0];

  async function populateTableFromMainProcess() {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "getBlacklistData"
      );

      result.forEach((entry) => {
        const newRow = successTable.insertRow();
        const emailCell = newRow.insertCell(0);
        const dateCell = newRow.insertCell(1);

        emailCell.textContent = entry.email;
        dateCell.textContent = new Date(entry.dateSent).toLocaleString();
      });
    } catch (error) {
      console.error(
        "An error occurred while getting data from the main process:",
        error
      );
    }
  }

  populateTableFromMainProcess();

  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const linkedinEmail = document.getElementById("linkedin-email").value;
    const linkedinPassword = document.getElementById("linkedin-password").value;
    const gmailEmail = document.getElementById("gmail-email").value;
    const gmailPassword = document.getElementById("gmail-password").value;
    const cvFile = document.getElementById("cv-upload").files[0];

    const payload = {
      linkedinEmail,
      linkedinPassword,
      gmailEmail,
      gmailPassword,
      cvFile,
    };

    console.log(payload);
  });
});
