document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent immediate navigation

    // Add the animation class to the body
    document.body.classList.add('animate-out');

    // Wait for the animation to complete, then navigate
    setTimeout(() => {
      window.location.href = link.href;
    }, 200); // Match this delay with the animation duration
  });
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Force re-render
    document.body.style.display = 'none';
    void document.body.offsetHeight; // Force reflow
    document.body.style.display = '';
  }
});

const sidebar = document.querySelector('.most-upper-head-div');

document.addEventListener('mousemove', function(e) {
  if (e.clientX > 220) {
    sidebar.classList.remove('hidden');
  }
})

const topbarButt = document.querySelector('.topbarButt');
if (topbarButt) {
  topbarButt.addEventListener('click', function() {
    sidebar.classList.add('hidden');
  })
}

const serverIP = 'ipower-backend.onrender.com';
//const serverIP = window.location.hostname;
const port = '';
const htt = 'https'

const returnIcon = document.querySelector('.fa-arrow-left');
if (returnIcon) {
  returnIcon.addEventListener('click', function() {
    window.history.back();
  });
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    window.history.back()
  };
})

const compInp = document.querySelector('.comp-inp');
if (compInp) {
  compInp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      localStorage.setItem('computerVal', compInp.value.trim());
      alert(`${compInp.value.trim()} saved`);
    }
  })
  
  compInp.value = localStorage.getItem('computerVal') || '';
}

/*
document.addEventListener('click', async function() {
  const respone = await fetch(`${htt}://${serverIP}${port}/items`)
  const items = await respone.json();
  const LCDs = items.filter(item => item.category_name === 'Back Cover');
  for(const [index, lcd] of LCDs.entries()) {
    const name = lcd.model_name + lcd.brand_name;
    const sku = lcd.SKU;
    const filtered = items.filter(item => (item.model_name + item.brand_name) === name);
    for(const flt of filtered) {
      const id = flt.id;
        await fetch(`${htt}://${serverIP}${port}/items/${id}`, {
        method:'PUT',
        headers:{'Content-Type': 'application/json'}, 
        body: JSON.stringify({
          SKU: sku
        })
      })
    }
    console.log(index)
  }
})
*/
