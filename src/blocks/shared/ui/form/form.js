document.querySelectorAll("[data-form]").forEach((itemForm) => {
  const pristine = new Pristine(itemForm, {
    classTo: 'required',
    errorTextParent: 'required',
  });

  const submitForm = (e) =>  {
    const _disabled = 'disabled';
    const valid = pristine.validate();
    const btnSubmit = pristine.form.querySelector("[data-form-btn]");
    valid ? btnSubmit.removeAttribute(_disabled) : btnSubmit.setAttribute(_disabled, _disabled);
    return valid ? true : e.preventDefault();
  }

  ["submit", "input"].forEach(item => itemForm.addEventListener(item, e => submitForm(e)))
})
