const addCustomerButt = document.querySelector('.add-brand-span');
const tableTbody = document.querySelector('.table-tbody');
const brandList = [];
const searchInp = document.querySelector('.search-inp-customer');
const tableDiv = document.querySelector('.table-div-customer');
const cleanInpIcon = document.querySelector('.fa-times-circle');

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

addCustomerButt.addEventListener('click', async () => {
  await fetch(`https://${serverIP}/deliveries`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: 'Delivery Name',
      phoneNo: '0750',
      address: 'Address',
    })
  })
  fetchCustomers();
})

async function fetchCustomers() {
  brandList.length = 0;
  const scrollPosition = tableDiv.scrollTop;
  tableTbody.innerHTML = '';
  const response = await fetch(`https://${serverIP}/deliveries`);
  const customers = await response.json();
  customers.sort((a, b) => b.id - a.id)
  console.log(customers)
  customers.forEach((customer, index) => {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
    <td class="index-td customerTd">${index + 1}</td>
    <td class="customer-id-td">${customer.id}</td>
    <td onclick="editCustomer(event, 'name')" class="brand-name-span">${customer.name}</td>
    <td onclick="editCustomer(event, 'phoneNo')">${customer.phoneNo || '0750'}</td>
    <td onclick="editCustomer(event, 'address')">${customer.address}</td>
    <td class="brand-name-td dateTimeCustomer-td">${customer.dateTime}<i class="fas fa-trash delete-icon" onclick="deleteBrand(event)"></i></td>
    `
    tableTbody.appendChild(newRow)
    brandList.push(newRow);
  });
  tableDiv.scrollTop = scrollPosition;
  applyCombinedFilters();
}

async function deleteBrand(event) {
  const deliveryId = Number(event.target.closest('tr').querySelector('.customer-id-td').innerHTML);
  const response = await fetch(`https://${serverIP}/posinvoices`);
  const posInvoices = await response.json();
  if (posInvoices.some(invoice => invoice.deliveryId === deliveryId)) {
    Toastify({
      text: `You can't delete this delivery, because it's used.`,
      duration: 2000,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(154, 59, 59)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
    return;
  };
  await fetch(`https://${serverIP}/deliveries/${deliveryId}`, {method: 'DELETE'});
  Toastify({
    text: `Successfully deleted!`,
    duration: 2000,
    gravity: 'top', // or 'top'
    position: 'center', // or 'right', 'center'
    style: {
      background: 'rgb(59, 154, 130)',
      borderRadius: '10px',
    },
    stopOnFocus: true,
  }).showToast();
  await fetchCustomers();
}

fetchCustomers();

function editCustomer(event, name) {
  if (event.target.closest('tr').classList.contains('delete-icon')) {return}
  if (event.target.closest('tr').querySelector('input')) {return};
  const newInp = document.createElement('input');
  newInp.className = 'newInp';
  const brandSpan = event.target.closest('td');
  const oldValue = brandSpan.innerHTML;
  brandSpan.innerHTML ='';
  newInp.value = oldValue;
  brandSpan.appendChild(newInp);
  newInp.focus();
  newInp.select();


  newInp.addEventListener('blur', async () => {
    const id = event.target.closest('tr').querySelector('.customer-id-td').innerHTML;
    if (oldValue === newInp.value.trim()) {brandSpan.innerHTML = oldValue;return}
    if (name === 'name') {
      const response = await fetch(`https://${serverIP}/deliveries`);
      const brands = await response.json();
      for (const brand of brands) {
        if (brand.id === Number(id)) continue
        if (brand[name].toLowerCase() === newInp.value.trim().toLowerCase()) {
          brandSpan.innerHTML = oldValue;
          Toastify({
            text: `Not updated because it already exists!`,
            duration: 4000,
            gravity: 'top', // or 'top'
            position: 'center', // or 'right', 'center'
            style: {
              background: 'rgb(154, 62, 59)',
              borderRadius: '10px',
            },
            stopOnFocus: true,
          }).showToast()
          return;
        }
      }
    }
    brandSpan.innerHTML = newInp.value.trim() || oldValue;
    await fetch(`https://${serverIP}/deliveries/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        [name]: newInp.value.trim()
      })
    })
    Toastify({
      text: `Successfully updated!`,
      duration: 1500,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(59, 154, 119)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
  })

  newInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {newInp.blur();}
  })
}

function applyCombinedFilters() {
  const searchVal = searchInp.value.trim().toLowerCase();
  const filteredArray = brandList.filter(row => {
    const brandNameSpan = row.querySelector('.brand-name-span').innerHTML.toLowerCase();
    return brandNameSpan.includes(searchVal)
  })
  tableTbody.innerHTML = '';
  filteredArray.forEach((row, index) => {
    tableTbody.appendChild(row);
    row.querySelector('.index-td').innerHTML = index + 1;
  }
  );
}

searchInp.focus();

searchInp.addEventListener('input', function() {
  applyCombinedFilters();
  cleanInpIcon.style.display = searchInp.value !== '' ? 'block' : 'none';
})

cleanInpIcon.addEventListener('click', function() {
  this.style.display = 'none';
  searchInp.value = '';
  applyCombinedFilters();
})
