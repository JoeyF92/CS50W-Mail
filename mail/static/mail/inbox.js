document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // listen for a new email submission
  newEmail = document.querySelector('#compose-form')
  newEmail.addEventListener('submit', event => {
    form = event.target.elements;
    console.log(form.recipients.value);
    console.log(form.subject.value);
    console.log(form.body.value);

    //do an api call 
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: form.recipients.value,
          subject: form.subject.value,
          body: form.body.value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });


   
  });

});




function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}