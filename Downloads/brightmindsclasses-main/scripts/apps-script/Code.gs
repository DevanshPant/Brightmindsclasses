// Apps Script: receives POST from site and submits response to the Google Form
// Deploy as "Web app" -> Execute as: Me, Who has access: Anyone, even anonymous

function doPost(e) {
  try {
    // Accept both JSON body or form-encoded fields
    var params = {};
    if (e.postData && e.postData.type === 'application/json') {
      params = JSON.parse(e.postData.contents);
    } else {
      params = e.parameter || {};
    }

    var FORM_ID = '1FAIpQLSeC-iaeX4k9Jzus0rseHbFsD8TsTuIL1tb2V_FE-bfyjwLHvA'; // <--- keep your form ID
    var form = FormApp.openById(FORM_ID);

    // Map of form question title -> submitted value
    var dataMap = {
      'Student Name': params.studentName || params['entry.330719284'] || '',
      'Current Class': params.studentClass ? 'Class ' + params.studentClass : (params['entry.313112089'] || ''),
      'Parent Contact': params.parentContact || params['entry.1750223016'] || '',
      'Email Address': params.email || params['entry.743997789'] || '',
      'Message (Optional)': params.message || params['entry.266804100'] || ''
    };

    // Build and submit a FormResponse so the entry appears in Google Forms responses
    var formResponse = form.createResponse();
    var items = form.getItems();
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var title = item.getTitle();
      if (dataMap[title] !== undefined && dataMap[title] !== '') {
        try {
          // Attempt to handle TextItem, ParagraphText, etc.
          if (item.getType() === FormApp.ItemType.TEXT) {
            formResponse.withItemResponse(item.asTextItem().createResponse(dataMap[title]));
          } else if (item.getType() === FormApp.ItemType.PARAGRAPH_TEXT) {
            formResponse.withItemResponse(item.asParagraphTextItem().createResponse(dataMap[title]));
          } else if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
            formResponse.withItemResponse(item.asMultipleChoiceItem().createResponse(dataMap[title]));
          } else {
            // Best-effort: try as a text item
            try { formResponse.withItemResponse(item.asTextItem().createResponse(dataMap[title])); } catch (e) { /* ignore */ }
          }
        } catch (inner) {
          // Non-textable item or not matched; ignore
        }
      }
    }

    formResponse.submit();

    // Send a notification email with the submitted data
    try {
      var RECIPIENT_EMAIL = 'hello@brightminds.in'; // change if you want a different recipient
      var subject = 'New enquiry from BrightMinds website';
      var bodyLines = [];
      bodyLines.push('A new enquiry was submitted via the website:');
      bodyLines.push('');
      bodyLines.push('Student Name: ' + (dataMap['Student Name'] || ''));
      bodyLines.push('Current Class: ' + (dataMap['Current Class'] || ''));
      bodyLines.push('Parent Contact: ' + (dataMap['Parent Contact'] || ''));
      bodyLines.push('Email Address: ' + (dataMap['Email Address'] || ''));
      bodyLines.push('Message: ' + (dataMap['Message (Optional)'] || ''));
      bodyLines.push('');
      bodyLines.push('Submitted at: ' + new Date().toString());

      var replyTo = dataMap['Email Address'] || '';
      var mailOptions = {};
      if (replyTo) { mailOptions.replyTo = replyTo; }

      MailApp.sendEmail(RECIPIENT_EMAIL, subject, bodyLines.join('\n'), mailOptions);
    } catch (mailErr) {
      // Don't fail the request if email sending fails; just log for debugging
      Logger.log('Error sending notification email: ' + mailErr.message);
    }

    var output = ContentService.createTextOutput(JSON.stringify({ status: 'ok' }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    var out = ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }));
    out.setMimeType(ContentService.MimeType.JSON);
    return out;
  }
}
