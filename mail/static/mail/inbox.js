document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => loadMailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => loadMailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => loadMailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  //listeners for replying and archiving emails
  document.querySelector('#reply').addEventListener('click', e => compose_email(e));
  document.querySelector('#archive').addEventListener('click', e => archive_email(e));

  // By default, load the inbox
  loadMailbox('inbox');

  // listen for a new email submission
  newEmail = document.querySelector('#compose-form').addEventListener('submit', e => send_email(e));
    

});




function compose_email(e) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#one-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  // check if it's a new email - or a reply and render values accordingly:
  let tar = e.currentTarget;
  //if it's a reply
  if (tar.getAttribute('data-sender')){
    document.querySelector('#compose-recipients').value = tar.getAttribute('data-recipients');
    dataSubject = tar.getAttribute('data-subject');
    if (tar.getAttribute('data-subject').startsWith('Re: ')){
      document.querySelector('#compose-subject').value = tar.getAttribute('data-subject');
    }
    else{
      document.querySelector('#compose-subject').value = 'Re: ' + tar.getAttribute('data-subject');
    }

    body = String.fromCharCode(13, 10) + 'On ' + tar.getAttribute('data-timestamp') + ', ' + tar.getAttribute('data-recipients') + ' wrote: ' + String.fromCharCode(13, 10) + '"' + tar.getAttribute('data-body') + '"'
    document.querySelector('#compose-body').value = body
  
  }
  //if it's a new email
  else{
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

  }

}

function loadMailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#one-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  inbox_render(mailbox)
}

function send_email(e){
  // extract the forms elements from the event and do an api call with them
  form = e.target.elements;
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
      // load users inbox
      loadMailbox('inbox')
  
  });

};


function inbox_render(mailbox){
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
      inbox = document.querySelector('#emails-view')
      emails.forEach(x => {  
        //create divs to insert email info into
        const container = document.createElement('div');
        const sender = document.createElement('div');
        const subject = document.createElement('div');
        const timestamp = document.createElement('div');
        //give the divs names so we can target them in css
        container.classList = "container-div";
        sender.classList = "sender-div";
        subject.classList = "subject-div";
        timestamp.classList = "timestamp-div";

        //check if email is read - to dictate color: 
        if(x.read === false){
          container.classList = "container-div read";
        }
        
        //add the email id to a data-something property on the container
        container.setAttribute("data-id", x.id)

        
        // if we're looking at sent mail 
        if(mailbox === 'sent'){
          sender.append(document.createTextNode(x.recipients));
          container.setAttribute("data-sent-email", true);
          
        }

        // if we're looking at either inbox or archive
        else{
          sender.append(document.createTextNode(x.sender));
          container.setAttribute("data-sent-email", false);

          //if it's the archived inbox - set data-archived to true, so the user can unarchive messages
          if(mailbox === 'archive'){
            container.setAttribute("data-archived", true);
          }
          //if it's the normal inbox - set data-archived to true, so the user can archive messages
          else
          {
            container.setAttribute("data-archived", false);
          }



        }
        //append the information and then append to the inbox
        subject.append(document.createTextNode(x.subject));
        timestamp.append(document.createTextNode(x.timestamp));
        container.append(sender, subject, timestamp);
        // listen for mouse over - so we can change cursor to grab
        container.addEventListener('mouseover', e => {
          e.target.style.cursor = "grab";
        });
        //listen for click so we can trigger function
        container.addEventListener('click', e => access_email(e));
        inbox.append(container);
       
      });
      if (emails.length < 1){
        inbox.append(document.createTextNode("Nothing to see here..."));
      }
  });
}

function access_email(e){
  // make sure we don't use inner div info - use current target rather than target
  let tar = e.currentTarget
  // get the email info
  emailId = tar.getAttribute('data-id')
  //check if it's an email the user sent
  isSent = tar.getAttribute('data-sent-email')
  //check if it's an archived email
  isArchived = tar.getAttribute('data-archived')
  //extract email from api with the id
  fetch('/emails/' + emailId)
  .then(response => response.json())
   .then(email => {
    // insert email data to the relevant html elements
    emailSender = document.querySelector('#email-from').innerHTML = '<strong>From: </strong>' + email.sender;
    emailRecipient = document.querySelector('#email-to').innerHTML = '<strong>To: </strong>' + email.recipients;
    emailSubject = document.querySelector('#email-subject').innerHTML  = '<strong>Subject: </strong> ' + email.subject;
    emailBody = document.querySelector('#email-body').innerHTML = email.body;

    // add data to the reply button
    reply = document.querySelector('#reply');
    reply.setAttribute("data-sender", email.recipients)
    reply.setAttribute("data-body", email.body)
    reply.setAttribute("data-recipients", email.sender)
    reply.setAttribute("data-subject", email.subject)
    reply.setAttribute("data-timestamp", email.timestamp)
      // then hide the other pages and just display the email
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#one-view').style.display = 'block'; 

    //if we're looking at a sent email:
    isSent = tar.getAttribute('data-sent-email');
    archive = document.querySelector('#archive');

    if (isSent === 'true'){
      reply.setAttribute("data-recipients", email.recipients)
      archive.style.display = 'none';
    
    }

    // if we're looking at an inbox or archived email
    else{
      //mark email as read:
      archive.style.display = 'block';
      read_status(true, email.id)
      //add the email id to the archive button:
      archive.setAttribute("data-id", email.id)

      // detirmine logic for whether we are archiving or unarchiving
      if (isArchived === 'true'){
        archive.innerHTML = 'Unarchive';
      }
      else{
        archive.innerHTML = 'Archive';
      }
    }   
  })

}

function read_status(status, id){
  fetch('/emails/' + id, {
    method: 'PUT',
    body: JSON.stringify({
        read: status
    })
  })
}

function archive_email(e)
{
  let tar = e.currentTarget
  //work out if button clicked was to archive or unarchive by its innter html
  let toArchive = tar.innerHTML
  toArchive = (toArchive === 'Archive') ? true : false;

  //get the email reuqested's id from the event and do api call to update
  id = tar.getAttribute('data-id')
  fetch('/emails/' + id, {
    method: 'PUT',
    body: JSON.stringify({
        archived: toArchive
    })
  })
  loadMailbox('inbox')

}