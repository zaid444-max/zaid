const currentCustomerId = localStorage.getItem('currentCustomerId');
const customerName = localStorage.getItem('customerName');
const tableTbody = document.querySelector('.table-tbody');
const allCustomerLoansArray = [];
const startIndexInp = document.querySelector('.start-index-inp');
const endIndexInp = document.querySelector('.end-index-inp');
let scrollPosition;
localStorage.removeItem('searchInpVal');
const languageSelect = document.querySelector('.langause-select');

const castomerNameDiv = document.querySelector('.customer-name-div');
castomerNameDiv.innerHTML = customerName;
const balanceSpan = document.querySelector('.balance-span');

const tableDiv = document.querySelector('.edit-table-div');

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

let isHeld = false;
const handshakeIcon = document.querySelector('.fa-handshake');
handshakeIcon.addEventListener('click', async () => {
  isInvoiceInfAdded = false
  if (isHeld) return;
  await fetch(`https://${serverIP}/loans`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      amount: '0',
      invoiceNum: null,
      note: '',
      customer_id: currentCustomerId
    })
  })
  fetchLoans();
})

let holdTimer;
handshakeIcon.addEventListener('mousedown', function() {
  isHeld = false;
  holdTimer = setTimeout(async () => {
    isHeld = true;
    await fetch(`https://${serverIP}/loans`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        amount: -Number(balanceSpan.innerHTML.replace(/,/g, '')),
        invoiceNum: null,
        note: 'All Paid',
        customer_id: currentCustomerId
      })
    })
    fetchLoans();
  }, 500);
})

handshakeIcon.addEventListener('mouseup', function() {
  clearTimeout(holdTimer); // Cancel if released early
  setTimeout(() => {isHeld = false}, 50)
});

handshakeIcon.addEventListener('mouseleave', function() {
  clearTimeout(holdTimer);
});

handshakeIcon.addEventListener('touchstart', function() {
  holdTimer = setTimeout(async () => {
    isHeld = true;
    await fetch(`https://${serverIP}/loans`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        amount: -Number(balanceSpan.innerHTML.replace(/,/g, '')),
        invoiceNum: null,
        note: 'All Paid',
        customer_id: currentCustomerId
      })
    });
    fetchLoans();
  }, 500);
}, { passive: true });

handshakeIcon.addEventListener('touchend', function() {
  clearTimeout(holdTimer);
  setTimeout(() => { isHeld = false }, 50);
});

handshakeIcon.addEventListener('touchcancel', function() {
  clearTimeout(holdTimer);
});


fetchLoans();

async function fetchLoans() {
  tableTbody.innerHTML = '';
  allCustomerLoansArray.length = 0;
  const response = await fetch(`https://${serverIP}/loans/${currentCustomerId}`);
  const loans = await response.json();
  loans.sort((a, b) => b.id -a.id)
  for(const [index, loan] of loans.entries()) {
    const newRow = document.createElement('tr');
    newRow.className = 'edit-new-row';
    newRow.innerHTML =`
    <td class="id-td">${loan.id}</td>
    <td class="index-td">${index + 1}</td>
    <td class="date-time-td">${loan.posNowDate || loan.loanNowDate}<i class="fas fa-trash" onclick="deleteLoan(event)"></i></td>
    <td class="amount-td" onclick="editLoan(event, 'number', 'amount')">${Number(loan.amount).toLocaleString()}</td>
    <td class="invoice-num-td" onclick="enterInvoice(event)">${loan.invoiceNum === null ? '#': '#' + loan.invoiceNum}</td>
    <td class="invoice-inf-td"></td>
    <td class="note-td" onclick="editLoan(event, 'text', 'note')">${loan.note}</td>
    `
    tableTbody.appendChild(newRow);
    allCustomerLoansArray.push(newRow);
    if (newRow.querySelector('.note-td').innerHTML === 'All Paid') newRow.style.backgroundColor = 'rgb(22, 22, 22)';
    if (newRow.querySelector('.invoice-num-td').innerHTML.split('#')[1] !== '') {
      newRow.querySelector('.invoice-num-td').style.color = 'rgb(208, 171, 62)';
      newRow.querySelector('.invoice-num-td').style.textDecoration  = 'underline';
    }
  }
  updateTotal();
  // Restore scroll
  if(localStorage.getItem('loanTableScrollPosition')) {
    tableDiv.scrollTop = localStorage.getItem('loanTableScrollPosition');
    localStorage.removeItem('loanTableScrollPosition');
  }
  if (scrollPosition) {
    tableDiv.scrollTop = scrollPosition;
    scrollPosition = '';
  }
}

async function updateTotal() {
  let totalBalance = 0;
  Array.from(tableTbody.children).forEach(row => {
    totalBalance += Number(row.querySelector('.amount-td').innerHTML.replace(/,/g, ''));
  })
  const balanceSpan = document.querySelector('.balance-span');
  balanceSpan.innerHTML = totalBalance.toLocaleString();
}

async function deleteLoan(event) {
  const result = await Swal.fire({
    title: "Are you sure to delete it?",
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
    const loanId = event.target.closest('tr').querySelector('.id-td').innerHTML;
    await fetch(`https://${serverIP}/loans/${loanId}`, {method: 'DELETE'});
    scrollPosition = tableDiv.scrollTop;
    fetchLoans();
    updateTotal();
    Toastify({
      text: `Loan deleted!`,
      duration: 2000,
      gravity: 'top',
      position: 'center',
      style: {
        background: 'rgb(61, 183, 138)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
  }
}

async function editLoan(event, type, updatedField) {
  const td = event.target;
  const loanId = td.closest('tr').querySelector('.id-td').innerHTML;
  const newInp = document.createElement('input');
  newInp.type = `${type}`;
  newInp.spellcheck = false;
  newInp.className = 'new-inp';
  const oldValue = td.innerHTML.replace(/,/g, '');
  td.innerHTML = '';
  newInp.value = oldValue;
  td.appendChild(newInp);
    newInp.addEventListener('keydown', (e) => {
      if (type === 'number' || type === 'invoiceNum') {
        newInp.style.width = '100px';
        if (['ArrowUp', 'ArrowDown', 'e', 'E'].includes(e.key)) {
          e.preventDefault();
        }
      }
      if (e.key === 'Enter') {
        newInp.blur();
      }
    })
  newInp.focus();
  newInp.select();
  newInp.addEventListener('blur', async () => {
    if (newInp.value.trim() === oldValue) {
      td.innerHTML = updatedField === 'note' ? oldValue : Number(oldValue).toLocaleString(); return
    }
    await fetch(`https://${serverIP}/loans/${loanId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        [updatedField]: newInp.value.trim().replace(/,/g, '')
      })
    })
    Toastify({
      text: `Loan Updated!`,
      duration: 1500,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(61, 183, 138)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
    td.innerHTML = updatedField !== 'note' ? Number(newInp.value.trim().replace(/,/g, '')).toLocaleString() : newInp.value.trim().replace(/,/g, '');
    updateTotal();
  })
}

function enterInvoice(event) {
  const invoiceNum = (event.target.innerHTML);
  if(invoiceNum.split('#')[1] === '') return;
  localStorage.setItem('targettedInvoiceId', Number(invoiceNum.split('#')[1]));
  document.body.classList.add('animate-out');
  setTimeout(() => {
    window.location.href = '../invoice/invoiceedit.html';
  }, 200);

  const scrollPosition = tableDiv.scrollTop;
  localStorage.setItem('loanTableScrollPosition', scrollPosition);
}

const broom = document.querySelector('.fa-broom');
broom.addEventListener('click', async function() {
  if (startIndexInp.value.trim() === '' && endIndexInp.value.trim() === '') {
    const result1 = await Swal.fire({
      title: "Delete all!",
      text: "You won't be able to undo this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete all!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: 'custom-popup',
      },
    });
    if (result1.isConfirmed) {
      await fetch(`https://${serverIP}/totalLoans/${currentCustomerId}`, {method: 'DELETE'});
      fetchLoans();
    }
  }
  if (startIndexInp.value.trim() !== '' && endIndexInp.value.trim() !== '') {
    const result2 = await Swal.fire({
      title: "Delete selected loans!",
      text: "You won't be able to undo this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete them!",
      cancelButtonText: "Cancel",
            customClass: {
        popup: 'custom-popup',
      },
    });
    if (result2.isConfirmed) {
      for(const row of Array.from(tableTbody.children)) {
        const loanId = row.querySelector('.id-td').innerHTML;
        await fetch(`https://${serverIP}/loans/${loanId}`, {method: 'DELETE'});
      }
      fetchLoans();
    }
  }
})

startIndexInp.addEventListener('keydown', function(e) {if (e.key === 'Enter') {endIndexInp.focus();endIndexInp.select()}});
endIndexInp.addEventListener('keydown', function(e) {if (e.key === 'Enter') {
  const filteredArray = allCustomerLoansArray.filter(row => {
    const startIndexInpVal = Number(startIndexInp.value.trim());
    const endIndexInpVal = Number(endIndexInp.value.trim());
    const rowIndex = Number(row.querySelector('.index-td').innerHTML);

    return rowIndex >= startIndexInpVal && endIndexInpVal >= rowIndex;
  })
  tableTbody.innerHTML = '';
  filteredArray.forEach(row => {tableTbody.appendChild(row);});
  updateTotal();
  this.addEventListener('keydown', function(e) {if (e.key === 'Enter') {createPDF()}});
}})

const RemoveIcon = document.querySelector('.RemoveIcon');
RemoveIcon.addEventListener('click', function() {
  tableTbody.innerHTML = '';
  allCustomerLoansArray.forEach(row => {tableTbody.appendChild(row)});
  updateTotal();
})

let isInvoiceInfAdded = false;
async function createPDF() {
  // Load jsPDFja
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  // Add Kurdish font
  doc.addFileToVFS("NotoNaskhArabic-Regular.ttf", font);
  doc.addFont("NotoNaskhArabic-Regular.ttf", "NotoNaskh", "normal");
  doc.setFont("NotoNaskh");

  if (!isInvoiceInfAdded) { 
    for(const row of tableTbody.querySelectorAll('tr')) {
      const invoiceNum = row.querySelector('.invoice-num-td').innerText.split('#')[1];
      if (invoiceNum === '') {continue};
      const response = await fetch(`https://${serverIP}/posinvoices/${invoiceNum}`);
      const invoice = await response.json();
      for(const item of invoice.items) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = item;
        const itemQnt = newRow.querySelector('.quantity-td').innerHTML;
        const combinedItemText = (
          newRow.querySelector('.name-td').querySelector('.item-name-span').innerText.trim() + 
          ` {${newRow.querySelector('.quantity-td').innerText.trim()} PCS}` +
          ` {${(Number(newRow.querySelector('.price-td').innerText.trim().replace(' IQD', '')) * 1000).toLocaleString()}}` +
          `${itemQnt !== '1' ? (' {' + ((Number(newRow.querySelector('.price-td').innerText.trim().replace(' IQD', ''))) * Number(newRow.querySelector('.quantity-td').innerText.trim()) * 1000).toLocaleString() + '}') : ''}` +
          ','
        )
        row.querySelector('.invoice-inf-td').innerHTML += combinedItemText;
      }
    };
    isInvoiceInfAdded = true;
  }

  // Get table reference
  const table = document.querySelector('table');
  const rows = Array.from(tableTbody.children);

  // Extract table data
  const tableData = [];
  rows.forEach(row => {
    const rowData = [];
    row.querySelectorAll('td').forEach(cell => {
      if (cell.matches('.id-td') || cell.matches('.index-td') || cell.matches('.delete-td')) return
      rowData.push(
        cell.matches('.amount-td') ? (parseFloat(cell.innerHTML.replace(/,/g, '')) * 1000).toLocaleString()  : 
        cell.innerText
      ); // Remove extra spaces
    });
    tableData.push(rowData);
  });
  const excludedClasses = ['id-th', 'order-num-th']; // Add more classes here
  const headers = Array.from(table.querySelectorAll('thead th'))
  .filter(th => !excludedClasses.some(cls => th.classList.contains(cls))) // Exclude matching elements
  .map(th => th.innerText.trim()); // Extract text

  const kurdish = languageSelect.value === 'Kurdish';
  const arabic = languageSelect.value === 'Arabic';

  const shopName = kurdish ? "پیشانگای ئایپاوەر" : arabic ? "محل ئايباور" : "iPower Shop";
  const Address = kurdish ? "هە ولیر کۆتری سە لام بینای شە هاب مۆڵ" : arabic ? "العنوان: أربيل كوتري سلام، مبنى شهـاب مول" : "Address: Erbil, Kotry Salam, Shahab Mall building";
  const customerName = kurdish ? 'ناوی کریار' : arabic ? 'اسم العميل' : 'Customer Name';
  const date = kurdish ? 'بە روار' : arabic ? 'التاريخ'  : 'Date';
  const currentBalance = kurdish ? 'حیسابی ئیستا' : arabic ? 'الحساب الحالي' : 'Current Balance';
  const TotalInvoiceAmount = kurdish ? 'کۆی گشتی ئە م وەسلە' : arabic ? 'إجمالي مبلغ الفاتورة' : 'Total Invoice Amount';
  const rightUpperPosition = (kurdish || arabic) ? 142 : 15;
  const leftUpperPosition = (kurdish || arabic) ? 15 : 155;

  // Add shop information before the table
  doc.setFontSize(18);
  doc.text(shopName, 105, 10, { align: "center" }); // Centered title
  doc.setFontSize(11);
  doc.text(Address, 105, 16, { align: "center" });
  doc.text("Phone: 0751 845 4545 - 0750 344 6261", 105, 22, { align: "center" });
  doc.text((kurdish || arabic) ? `${castomerNameDiv.innerText} :${customerName}` : `${customerName}: ${castomerNameDiv.innerText}`, rightUpperPosition, 35);
  doc.text((kurdish || arabic) ? `${getLatestDate()} :${date}` : `${date}: ${getLatestDate()}`, leftUpperPosition, 30);
  doc.text(`${getLatestTime()}`, leftUpperPosition, 35);
  
  // Generate PDF table
  doc.autoTable({
    head: [headers],
    body: tableData,
    tableWidth: 'wrap', // or try 'auto'
    startY: 38, // Space from top
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 2, textColor: [0, 0, 0]},
    headStyles: { textColor: [255, 255, 255] , fillColor: [162, 108, 255] },
    margin: { bottom: 30 }, // Reserve space for footer
    columnStyles: {
      3: { cellWidth: 'wrap' }
    },
    didParseCell: function (data) {
      if (data.column.index === 0) { data.cell.styles.cellWidth = 24; }
      if (data.column.index === 1) { 
        data.cell.styles.cellWidth = 24;
        const text = data.cell.text[0];
        if (text.includes('-')) data.cell.styles.textColor = 'red'}
      if (data.column.index === 2) { data.cell.styles.cellWidth = 21; }
      
      if (data.column.index === 3) { // 4th column (zero-based index)
          let text = data.cell.text[0]; // Get the text content
          let orderNum = 0;
          data.cell.text = text.split('},').map((line, index, arr) => {
            orderNum++;
              return index < arr.length - 1 ? `${orderNum}- ` + line.trim() + "}," : line.trim();
            });
          let maxLineLength = Math.max(...data.cell.text.map(line => line.length));
          
          const maxColumnWidth = 100; 
          data.cell.styles.cellWidth = Math.min(80 + (maxLineLength * 1.4), maxColumnWidth);
          data.cell.styles.fontSize = 9;
      }
      
      if (data.column.index === 4) { data.cell.styles.cellWidth = 15;}
      if (data.section === 'head' && data.column.index === 2) { // Third column (zero-based index)
        data.cell.styles.fontSize = 8; // Set font size for the third column header
      }
    },
    didDrawPage: function (data) {
      lastTableY = data.cursor.y; // Save last position of table
    },
    showHead: 'firstPage'
  });
  
  // Get final Y position after the table
  let finalY = lastTableY + 10; 
  let pageHeight = doc.internal.pageSize.height; 
  
  // If footer exceeds page, create a new page
  if (finalY + 30 > pageHeight) {  
    doc.addPage();
    finalY = 20; // Reset Y position for new page
  }
  let total = 0;
  const response = await fetch(`https://${serverIP}/loans/${currentCustomerId}`);
  const customerLoans = await response.json();
  customerLoans.forEach(loan => total += Number(loan.amount));
  // Add footer information **only once at the end**
  doc.text(`${TotalInvoiceAmount}: ${(Number(balanceSpan.innerHTML.replace(/,/g, '')) * 1000).toLocaleString()}`, rightUpperPosition, finalY);
  doc.text(`${currentBalance}: ${(total * 1000).toLocaleString()}`, rightUpperPosition, finalY + 6);

  // Save the PDF
  doc.save(`${castomerNameDiv.innerText}.pdf`); // Downloads as 'invoice.pdf'
}

function getLatestDate() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based
  const year = currentDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate;
}

function getLatestTime() {
  const kurdish = languageSelect.value === 'Kurdish';
  const arabic = languageSelect.value === 'Arabic';
  const currentDate = new Date();
  const options = { 
      weekday: 'long', // Full day name (e.g., "Saturday")
      hour: 'numeric', // Hour in 12-hour format
      minute: 'numeric', // Minutes
      hour12: true // Use AM/PM format
  };
  let formattedTime = currentDate.toLocaleTimeString('en-US', options);
  const day = formattedTime.split(' ')[0];
  let tanslatedDay;
  if (kurdish) {
    day === 'Saturday' ? tanslatedDay = 'شە ممە' :
    day === 'Sunday' ? tanslatedDay = 'یەک شەممە' :
    day === 'Monday' ? tanslatedDay = 'دوو شە ممە' :
    day === 'Tuesday' ? tanslatedDay = 'سێ شەممە' :
    day === 'Wednesday' ? tanslatedDay = 'چوار شەممە' :
    day === 'Thursday' ? tanslatedDay = 'پینج شە ممە' :
    day === 'Friday' ? tanslatedDay = 'هە ینی' :
    '';
    formattedTime = `${formattedTime.split(' ')[1]} ${formattedTime.split(' ')[2]} ${tanslatedDay} `
  } else if (arabic) {
    day === 'Saturday' ? tanslatedDay = 'السبت  ' :
    day === 'Sunday' ? tanslatedDay = 'الأحد' :
    day === 'Monday' ? tanslatedDay = 'الاثنين' :
    day === 'Tuesday' ? tanslatedDay = 'الثلاثاء' :
    day === 'Wednesday' ? tanslatedDay = 'الأربعاء' :
    day === 'Thursday' ? tanslatedDay = 'الخميس' :
    day === 'Friday' ? tanslatedDay = 'الجمعة' :
    '';
    formattedTime = `${formattedTime.split(' ')[1]} ${formattedTime.split(' ')[2]} ${tanslatedDay} `
  }
  return formattedTime;
}

async function lastBalancePDF() {
  // Load jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add Kurdish font
  doc.addFileToVFS("NotoNaskhArabic-Regular.ttf", font);
  doc.addFont("NotoNaskhArabic-Regular.ttf", "NotoNaskh", "normal");
  doc.setFont("NotoNaskh");

  // Load the image dynamically
  const img = new Image();
  img.src = '../iPower_stamp.png'; // Make sure the file is in the correct path
  img.onload = async function () {
    // Convert image to Base64 using Canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = canvas.toDataURL('image/png'); // Convert to Base64

    const kurdish = languageSelect.value === 'Kurdish';
    const arabic = languageSelect.value === 'Arabic';

    const shopName = kurdish ? "پیشانگای ئایپاوەر" : arabic ? "محل ئايباور" : "iPower Shop";
    const Address = kurdish ? "هە ولیر کۆتری سە لام بینای شە هاب مۆڵ" : arabic ? "العنوان: أربيل كوتري سلام، مبنى شهـاب مول" : "Address: Erbil, Kotry Salam, Shahab Mall building";
    const customerName = kurdish ? 'ناوی کریار' : arabic ? 'اسم العميل' : 'Customer Name';
    const date = kurdish ? 'بە روار' : arabic ? 'التاريخ'  : 'Date';
    const OldBalance = kurdish ? 'حیسابی کۆن' : arabic ? 'حساب القديم' : 'Old Balance';
    const Then = kurdish ? 'کە واتە' : arabic ? 'ثم' : 'Then';
    const currentBalance = kurdish ? 'حیسابی ئیستا' : arabic ? 'الحساب الحالي' : 'Current Balance';
    const rightUpperPosition = (kurdish || arabic) ? 142 : 15;
    const leftUpperPosition = (kurdish || arabic) ? 15 : 155;
    const LastTransaction = kurdish ? 'کۆتا مامەلە' : arabic ? 'آخر معاملة' : 'Last Transaction';
    const TransactionStatus = kurdish ? 'باری مامەلە' : arabic ? 'حالة المعاملة' : 'Transaction Status'

    // Add image to the PDF
    doc.addImage(imgData, 'PNG', 90, 30, 40, 40); // (image, type, x, y, width, height)
    const targetAmount = tableTbody.querySelectorAll('tr')[0].querySelector('.amount-td').innerHTML.replace(/,/g, '');
    const targetNote = tableTbody.querySelectorAll('tr')[0].querySelector('.note-td').innerHTML;
    let total = 0;
    const response = await fetch(`https://${serverIP}/loans/${currentCustomerId}`);
    const customerLoans = await response.json();
    customerLoans.forEach(loan => total += Number(loan.amount));

    // Add shop information
    doc.setFontSize(18);
    doc.text(shopName, 115, 10, {align: 'center'}); // Adjusted to fit beside the image
    doc.setFontSize(10);
    doc.text(Address, 115, 16, {align: 'center'});
    doc.text("Phone: 0751 845 4545 - 0750 344 6261", 115, 22, {align: 'center'});
    doc.text(`${date}: ${getLatestDate()}`, leftUpperPosition, 40);
    doc.text(`${getLatestTime()}`, leftUpperPosition, 46);console.log(targetAmount)
    doc.text( (kurdish || arabic) ? `${castomerNameDiv.innerText.replace(/,/g, '')} :${customerName}` : `${customerName}: ${castomerNameDiv.innerText.replace(/,/g, '')}`, rightUpperPosition, 40);
    const LastTransactionAmount = (Number(targetAmount) * 1000).toLocaleString();
    doc.text(`${((kurdish || arabic) && targetAmount !== '0' && targetAmount.includes('-')) ? '-' : ''}${LastTransaction}: ${(kurdish || arabic) ? LastTransactionAmount.replace('-', ' ') : LastTransactionAmount}`, rightUpperPosition, 46);
    doc.text((kurdish || arabic) ? `${targetNote} :${TransactionStatus}` : `${TransactionStatus}: ${targetNote}`, rightUpperPosition, 51);
    doc.text('-----------------------------------------', rightUpperPosition, 57);
    doc.text(`${OldBalance}: ${((total - Number(targetAmount)) * 1000).toLocaleString()}`, rightUpperPosition, 63);
    doc.text(`${Then}: ${((total - Number(targetAmount)) * 1000).toLocaleString()}${!targetAmount.includes('-') ? ' +' : ''} ${(Number(targetAmount) * 1000).toLocaleString()}`, rightUpperPosition, 69);
    doc.text(`${currentBalance}: ${(total * 1000).toLocaleString()}`, rightUpperPosition, 75);

    // Save the PDF
    doc.save(`${castomerNameDiv.innerText.replace(/,/g, '')}.pdf`); // Downloads as 'invoice.pdf'
  };
}

document.addEventListener('click', function(e) {
  const targetLink = e.target.closest('a');
  if (targetLink) {
    localStorage.removeItem('savedSort');
    sessionStorage.removeItem('loanScrollPostion')
  } 
})

window.addEventListener('DOMContentLoaded', () => {
  const showToast = localStorage.getItem('showLoanToast');
  if (showToast === 'true') {
    Toastify({
      text: `Loan added!`,
      duration: 2000,
      gravity: 'top',
      position: 'center',
      style: {
        background: 'rgb(61, 183, 138)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
    localStorage.removeItem('showLoanToast'); // Clean up after showing
  }
});

languageSelect.addEventListener('change', function () {
  const langauseSelectVal = this.value;
  localStorage.setItem('langauseSelectVal', langauseSelectVal);
})

languageSelect.value = localStorage.getItem('langauseSelectVal') || 'Kurdish';
