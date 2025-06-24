const addCustomerButt = document.querySelector('.add-brand-span');
const tableTbody = document.querySelector('.table-tbody');
const brandList = [];
const searchInp = document.querySelector('.search-inp-customer');
const tableDiv = document.querySelector('.table-div-customer');
const cleanInpIcon = document.querySelector('.fa-times-circle');

addCustomerButt.addEventListener('click', async () => {
  await fetch(`http://${serverIP}:${port}/customers`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: 'Customer Name',
      balance: '0',
      phoneNo: '0750',
      address: 'Address',
      remark: 'Remark',
      priceLevel: 'Price Four'
    })
  })
  fetchCustomers();
})

async function fetchCustomers() {
  brandList.length = 0;
  const scrollPosition = tableDiv.scrollTop;
  tableTbody.innerHTML = '';
  const response = await fetch(`http://${serverIP}:${port}/customers`);
  const customers = await response.json();
  customers.sort((a, b) => b.id - a.id)
  customers.forEach((customer, index) => {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
    <td class="index-td customerTd">${index + 1}</td>
    <td class="customer-id-td">${customer.id}</td>
    <td onclick="editCustomer(event, 'name')" class="brand-name-span">${customer.name}</td>
    <td onclick="editCustomer(event, 'phoneNo')">${customer.phoneNo || '0750'}</td>
    <td onclick="updateDelFee(event)">${Number(customer.delFee)}</td>
    <td onclick="editCustomer(event, 'address')">${customer.address}</td>
    <td onclick="editCustomer(event, 'remark')" class="remark-th">${customer.remark}</td>
    <td>
    <select class="price-level-select price-level-td">
    <option ${customer.priceLevel === 'Price One' ? 'selected': ''}>Price One</option>
    <option ${customer.priceLevel === 'Price Two' ? 'selected': ''}>Price Two</option>
    <option ${customer.priceLevel === 'Price Three' ? 'selected': ''}>Price Three</option>
    <option ${customer.priceLevel === 'Price Four' ? 'selected': ''}>Price Four</option>
    <option ${customer.priceLevel === 'Price Five' ? 'selected': ''}>Price Five</option>
    <option ${customer.priceLevel === 'Price Six' ? 'selected': ''}>Price Six</option>
    <option ${customer.priceLevel === 'Price Seven' ? 'selected': ''}>Price Seven</option>
    </select>
    </td>
    <td class="brand-name-td dateTimeCustomer-td">${customer.dateTime}<i class="fas fa-trash delete-icon" onclick="deleteBrand(event)"></i></td>
    `
    tableTbody.appendChild(newRow)

    const priceLevelSelect = newRow.querySelector('.price-level-select');
    priceLevelSelect.addEventListener('change', async (e) => {
      const itemId = e.target.closest('tr').querySelector('.customer-id-td').innerHTML;
      const selectValue = priceLevelSelect.value;
      await fetch(`http://${serverIP}:${port}/customers/${(itemId)}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body:
        JSON.stringify({
          priceLevel: selectValue
        })
      });
    })
    brandList.push(newRow);
  });
  tableDiv.scrollTop = scrollPosition;
  applyCombinedFilters();
}

async function deleteBrand(event) {
  const customerId = Number(event.target.closest('tr').querySelector('.customer-id-td').innerHTML);
  const response = await fetch(`http://${serverIP}:${port}/posinvoices`);
  const posInvoices = await response.json();
  if(posInvoices.some(invoice => invoice.customerId === customerId)) {
    Toastify({
      text: `You can't delete this customer, because it's used.`,
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
  await fetch(`http://${serverIP}:${port}/customers/${customerId}`, {method: 'DELETE'});
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
      const response = await fetch(`http://${serverIP}:${port}/customers`);
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
    await fetch(`http://${serverIP}:${port}/customers/${id}`, {
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

function updateDelFee(event) {
  const newInp = document.createElement('input');
  newInp.className = 'delFee-inp';
  const oldVal = event.target.innerHTML;
  event.target.innerHTML = '';
  event.target.appendChild(newInp);
  newInp.value = oldVal;
  const rowETarget = event.target;
  newInp.select();
  newInp.focus();
  newInp.addEventListener('blur', async function () {
  if (newInp.value.trim() === '' || isNaN(newInp.value.trim())){ rowETarget.innerHTML = oldVal; return};
  const id = rowETarget.closest('tr').querySelector('.customer-id-td').innerHTML;
  await fetch(`http://${serverIP}:${port}/customers/${id}`, {
    method:'PUT',
    headers:{'Content-Type': 'application/json'},
    body: JSON.stringify({
      delFee: newInp.value.trim()
    })
  })
  rowETarget.innerHTML = newInp.value.trim();
  })
  newInp.addEventListener('keydown', function(e) {if (e.key === 'Enter') newInp.blur()})
}