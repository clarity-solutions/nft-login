/* eslint-disable no-undef */

window.addEventListener("load", () => {
  if (!window.ethereum) {
    return;
  }

  const $ = document.querySelector.bind(document);

  window.web3 = new Web3(ethereum);

  const submitButton = $("#submit-login");
  submitButton.disabled = true;

  const { uid } = $("#uid").dataset;
  const messageToBeSigned = `Sign in with NFT: ${uid}`;

  const onConnect = async () => {
    // Open a connect window. It resolves when the connection is accepted.
    const [ethereamAddress] = await ethereum.enable();

    $("#connected-account").textContent = `Connected: ${ethereamAddress}`;
    $("#account-visibility-toggle").className = "";

    const signature = await web3.eth.personal.sign(
      messageToBeSigned,
      ethereamAddress,
      ""
    ); // 署名できる

    $("input[name=signature]").value = signature;
    $("input[name=ethereamAddress]").value = ethereamAddress;
    // Make the rest form visible by resetting class
    $("#form-visibility-toggle").className = "";

    // Enable the submit button only when all inputs have value
    const inputs = [$("input[name=contractAddress]"), $("input[name=tokenID]")];
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        const ready = inputs.every((input) => Boolean(input.value));
        submitButton.disabled = !ready;
      });
    });
  };

  $("#connect").addEventListener("click", onConnect);

  // Show error message.
  // It shows search param "error" directly.
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("error")) {
    const element = document.createElement("p");
    element.textContent = searchParams.get("error");
    element.id = "error";
    $("#error-container").append(element);
  }
});
