// Configure Credentials to use Cognito
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'eu-west-2:05437d5b-88b5-4fd4-b48d-765066108040'
});

AWS.config.region = 'eu-west-2';
// We're going to partition Amazon Kinesis records based on an identity.
// We need to get credentials first, then attach our event listeners.
console.log("logging in")

AWS.config.credentials.get(function(err) {
    // attach event listener
    if (err) {
        alert('Error retrieving credentials.');
        console.error(err);
        return;


    }

    console.log("logged in")
    // create Amazon Kinesis service object
    var kinesis = new AWS.Kinesis({
        apiVersion: '2013-12-02'
    });

    // Get the ID of the Web page element.
    var blogContent = document.getElementById('BlogContent');

    // Get Scrollable height
    var scrollableHeight = blogContent.clientHeight;

    var recordData = [];
    var TID = null;
    blogContent.addEventListener('scroll', function(event) {
        clearTimeout(TID);
        // Prevent creating a record while a user is actively scrolling
        TID = setTimeout(function() {
            // calculate percentage
            var scrollableElement = event.target;
            var scrollHeight = scrollableElement.scrollHeight;
            var scrollTop = scrollableElement.scrollTop;

            var scrollTopPercentage = Math.round((scrollTop / scrollHeight) * 100);
            var scrollBottomPercentage = Math.round(((scrollTop + scrollableHeight) / scrollHeight) * 100);

            // Create the Amazon Kinesis record
            var record = {
                Data: JSON.stringify({
                    blog: window.location.href,
                    scrollTopPercentage: scrollTopPercentage,
                    scrollBottomPercentage: scrollBottomPercentage,
                    time: new Date()
                }),
                PartitionKey: 'partition-' + AWS.config.credentials.identityId
            };
            recordData.push(record);
        }, 100);
    });

    // upload data to Amazon Kinesis every second if data exists
    setInterval(function() {
        if (!recordData.length) {
            return;
        }
        // upload data to Amazon Kinesis
        console.log("sending record")
        kinesis.putRecords({
            Records: recordData,
            StreamName: 'georgec-kinesis'
        }, function(err, data) {
            if (err) {
                return console.error(err);
            }
            console.log(data)
        });
        // clear record data
        recordData = [];
    }, 1000);
});