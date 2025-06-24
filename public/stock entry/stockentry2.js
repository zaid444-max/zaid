const stockentryTableTbody = document.querySelector('.stock-entry-table').getElementsByTagName('tbody')[1];
const addStockentryButt = document.querySelector('.add-stock-entry');
const newRow = stockentryTableTbody.insertRow();
const initialTableTbodyArrey = [];
const inpValResetterIcon = document.querySelector('.fa-times-circle');
const tableDiv = document.querySelector('.table-div');
const searchInp = document.querySelector('.search-inp');

addStockentryButt.addEventListener('click', () => {
  document.body.classList.add('animate-out');
  setTimeout(() => {
    window.location.href = 'newstockentry.html';
  }, 200)
});

stockentryTableTbody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-icon')) {
    const row = e.target.closest('tr');
    const invoiceId = Number(Array.from(row.children)[1].innerHTML);
    const invoiceStatus = row.querySelector('.invoice-status').innerHTML;
    if (invoiceStatus === 'Submitted') {
      Toastify({
        text: `You must cancel this invoice then delete it`,
        duration: 4000,
        gravity: 'top', // or 'top'
        position: 'center', // or 'right', 'center'
        style: {
          background: 'rgb(154, 59, 59)',
          borderRadius: '10px',
        },
        stopOnFocus: true,
      }).showToast();
      return;
    }
    const result = await Swal.fire({
      title: "Delete this invoice!",
      text: "You won't be able to undo this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: 'custom-popup',
      },
    });
    if (result.isConfirmed) {
      const response = await fetch(`http://${serverIP}:${port}/stockentinvs/${invoiceId}`);
      try {
        const invoice = await response.json()
        const invoiceItems = invoice.items;
        for(const item of invoiceItems) {
          if (item.quantity > item.lastQuantity) {
            Toastify({
              text: `You can't delete this invoice, because it's used, you must return its items then can delete it.`,
              duration: 5000,
              gravity: 'top', // or 'top'
              position: 'center', // or 'right', 'center'
              style: {
                background: 'rgb(154, 59, 59)',
                borderRadius: '10px',
              },
              stopOnFocus: true,
            }).showToast();
            return;
          }
        };
        for (let index = 0; index < invoiceItems.length; index++) {
          if (invoice.invStatus !== 'Pending') {
          const item = invoiceItems[index]
          const itemId = item.itemId;
          const response = await fetch(`http://${serverIP}:${port}/items/${itemId}`);
          const targettedItem = await response.json();
          targettedItem.quantity -= item.quantity;
          await fetch(`http://${serverIP}:${port}/items/${itemId}`, {
            method: 'PUT',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify({
              quantity: targettedItem.quantity
            })
          });
          }
          /*
           else if (invoice.invStatus === 'Pending') {
            const item = invoiceItems[index]
            const itemId = item.itemId;
            const response = await fetch(`http://${serverIP}:${port}/items/${itemId}`);
            const targettedItem = await response.json();
            targettedItem.pendingQnt -= item.quantity;
            await fetch(`http://${serverIP}:${port}/items/${itemId}`, {
              method: 'PUT',
              headers:{'Content-Type': 'application/json'},
              body: JSON.stringify({
                pendingQnt: targettedItem.pendingQnt
              })
            });
          }
            */
        };
        await fetch(`http://${serverIP}:${port}/stockentinvs/${invoiceId}`,
          {method: 'DELETE'}
          
        ).then(response => {
          if (!response.ok) {console.log('yes')}
          Toastify({
            text: `Successfully deleted!`,
            duration: 2000,
            gravity: 'top', // or 'top'
            position: 'center', // or 'right', 'center'
            style: {
              background: 'rgb(37, 177, 98)',
              borderRadius: '10px',
            },
            stopOnFocus: true,
          }).showToast();
        })
        row.remove()
      } catch(err) {
        Toastify({
          text: `This invoice is already deleted!`,
          duration: 5000,
          gravity: 'top', // or 'top'
          position: 'center', // or 'right', 'center'
          style: {
            background: 'rgb(177, 46, 37)',
            borderRadius: '10px',
          },
          stopOnFocus: true,
        }).showToast();
      }
      updateTotal();
    }

  } else if (!e.target.classList.contains('delete-icon')) {
    const invoiceId = e.target.closest('tr').querySelector('td.id-td').innerHTML;
      localStorage.setItem('currentInvoiceId', invoiceId);
      sessionStorage.setItem('stockTableScrollPosition', tableDiv.scrollTop);
      document.body.classList.add('animate-out');
      localStorage.setItem('searchInpVal', searchInp.value.trim());
      setTimeout(() => {
        window.location.href = 'stockentryedit.html';
      }, 200)

  }
});

const itemListArray = [];
async function fetchItems() {
  const response = await fetch(`http://${serverIP}:${port}/items`);
  const items = await response.json();
  for(const item of items) {itemListArray.push(item);};
}

searchInp.focus();
searchInp.addEventListener('input', function() {
  inpValResetterIcon.style.display = 'block';
  applyCombinedFilters();
  if (this.value === '') inpValResetterIcon.style.display = 'none';
  searchTable();
});

function applyCombinedFilters() {
  const searchValue = searchInp.value.trim().toLocaleLowerCase();
  const searchWords = searchValue.split(" "); // Split input into words
  // Find all matching items instead of just one
  const matchingItems = itemListArray.filter(item => {
    const combinedText = (
      item.brand_name + item.model_name + item.category_name + item.quality_name +
      item.SKU + item.boxId
    ).toLowerCase();
    return searchWords.every(word => combinedText.includes(word));
  });
  const filteredRows = initialTableTbodyArrey.filter(tr => {
    const itemMatch = matchingItems.some(item1 => tr.itemList.some(item2 => item1.id === item2.itemId));
    const searchMatch = searchValue === '' || tr.row.querySelector('.id-td').innerHTML.includes(searchValue) || tr.row.querySelector('.sku-td').innerHTML.toLowerCase().includes(searchValue) || tr.row.querySelector('.time-td').innerHTML.toLowerCase().includes(searchValue);

    return itemMatch || searchMatch;
  })
  stockentryTableTbody.innerHTML = '';
  filteredRows.forEach((tr, index) => {
    stockentryTableTbody.appendChild(tr.row); tr.row.querySelector('.order-num-td').innerHTML = index + 1;
  });
  updateTotal();
  if (searchInp.value !== '') inpValResetterIcon.style.display = 'block';
}

stockentryTableTbody.innerHTML = '';
fetch(`http://${serverIP}:${port}/stockentinvs`, { cache: 'no-store' })
.then(response => response.json())
.then(invoices => {
  initialTableTbodyArrey.length = 0;
  invoices.sort((a, b) => b.id - a.id);
  invoices.forEach((invoice, index) => {
    let total = 0;
    invoice.items.forEach(item => {
      total += item.buyPrice * item.quantity
    })
    const newRow = stockentryTableTbody.insertRow();
    newRow.className = 'new-row'
    newRow.innerHTML = `
    <td class="order-num-td">${index + 1}</td>
    <td class="id-td">${invoice.id}</td>
    <td class="sku-td">${invoice.sku === null ? '' : invoice.sku}</td>
    <td class="total-iqd-td">${total.toLocaleString()}</td>
    <td class="time-td">${invoice.nowDate}</td>
    <td class="invoice-status">${invoice.invStatus}</td>
    <td class="status-icon"><i class="fas fa-circle"></i></td>
    <td><i class="fas fa-trash delete-icon"></i></td>
    `;
    if (newRow.querySelector('.invoice-status').innerHTML === 'Pending') {
      newRow.querySelector('.status-icon').style.color = 'rgb(23, 85, 239)';
    } else if (newRow.querySelector('.invoice-status').innerHTML === 'Submitted') {
      newRow.querySelector('.status-icon').style.color = 'rgb(25, 225, 95)';
    } else if (newRow.querySelector('.invoice-status').innerHTML === 'Canceled') {
      newRow.querySelector('.status-icon').style.color = 'orange';
    };
    const InvoiceItemList = [];
    invoice.items.forEach(item => InvoiceItemList.push(item))
    initialTableTbodyArrey.push({
      row: newRow,
      itemList: InvoiceItemList
    });
  });
  tableDiv.scrollTop = sessionStorage.getItem('stockTableScrollPosition');
  sessionStorage.removeItem('stockTableScrollPosition');
  // Ensure data is loaded before running filters
  async function initialize() {
    await fetchItems(); // Wait for fetch to complete
    applyCombinedFilters(); // Run filter after fetching
  }
  initialize();
  updateTotal();
});

function updateTotal() {
  let totalBaught = 0;
  let totalOnWay = 0;
  Array.from(stockentryTableTbody.children).forEach(row => {
    const totalIQDRow = parseFloat(row.querySelector('.total-iqd-td').innerHTML.replace(/,/g, ''));
    const status = row.querySelector('.invoice-status').innerHTML;
    if (status !== 'Pending') {totalBaught += totalIQDRow;}
    if (status === 'Pending') {totalOnWay += totalIQDRow;}
  });
  document.querySelector('.total-baught-span').innerHTML = totalBaught.toLocaleString();
  document.querySelector('.total-on-way-span').innerHTML = totalOnWay.toLocaleString();
}

inpValResetterIcon.addEventListener('click', function() {
  searchInp.value = '';
  this.style.display = 'none';
  applyCombinedFilters();
  searchInp.focus();
})

const isInvoiceSubmitted = localStorage.getItem('isInvoiceSubmitted');
if (isInvoiceSubmitted) {
  Toastify({
    text: `Invoice Submitted!`,
    duration: 2000,
    gravity: 'top', // or 'top'
    position: 'center', // or 'right', 'center'
    style: {
      background: 'rgb(61, 183, 138)',
      borderRadius: '10px',
    },
    stopOnFocus: true,
  }).showToast();
  localStorage.removeItem('isInvoiceSubmitted');
}