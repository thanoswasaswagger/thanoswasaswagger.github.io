// Itar Lok media rules: one image is required for every new product; extra images are optional.
const productImages = document.getElementById('pImages');
const productId = document.getElementById('productId');

function syncProductImageRequirement(isNew) {
  if (!productImages) return;
  productImages.multiple = true;
  productImages.required = Boolean(isNew);
  const label = productImages.closest('.field')?.querySelector('label');
  if (label) label.textContent = 'Product images — 1 required, more optional';
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#newProduct')) {
    setTimeout(() => syncProductImageRequirement(true), 0);
  }
  if (event.target.closest('[data-edit]')) {
    setTimeout(() => syncProductImageRequirement(false), 0);
  }
});

document.getElementById('productModal')?.addEventListener('click', () => {
  if (!productId?.value) syncProductImageRequirement(true);
});

// Initial state is safe for a freshly opened "Add product" form.
syncProductImageRequirement(!productId?.value);
