(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|8310-5', 'http://loinc.org|85354-9']
                      }
                    }
                  });
				  
		var allergy = smart.patient.api.fetchAll({
			"type": 'AllergyIntolerance',
			"query": {
				"clinical-status": 'active'
			}
		});

        $.when(pt, obv, allergy).fail(onError);

        $.when(pt, obv, allergy).done(function(patient, obv, allergy) {
	
		
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('85354-9'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('85354-9'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          var temperature = byCodes('8310-5');
	  var allergytable = [];
		var allergyreaction;
		
	
		
	/* 	allergy.forEach(element => {
				console.log(element);
			if (typeof element != 'undefined'){
			allergytable.push("<tr><th>Allergy:</th><td>"+element.code.text+"</tr></td>");
			}}) */
		
		if (typeof allergy != 'undefined'){
			allergytable.push("<tr><th>Allergies</th><th>Reactions</th></tr>");
		}
		
		allergy.forEach(element => {
				//console.log(element);
			if (typeof element != 'undefined'){
			allergytable.push(getAllergyAndReaction(element));
			}})
	

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
          p.temperature = getQuantityValueAndUnit(temperature[0]);
		p.allergytable = allergytable;
		

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
		
	p.allergyreaction=getAllergyAndReaction(allergy[0]);
		console.log(p.allergyreaction);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      temperature: {value: ''},
	    allergytable: [],
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }
	
function getAllergyAndReaction(ag) {
	var alg='';
	if (typeof ag != 'undefined' &&
	    typeof ag.code != 'undefined' &&
	    typeof ag.code.text != 'undefined'){
			
	    alg = "<tr><td>"+ag.code.text+"</td>";
	    
	    if (typeof ag.reaction != 'undefined' &&
	    	typeof ag.reaction[0].manifestation != 'undefined' &&
	        typeof ag.reaction[0].manifestation[0].text != 'undefined' ){
				console.log(ag.reaction[0].manifestation[0].text);
				
			return alg+"<td>"+ag.reaction[0].manifestation[0].text+"</td></tr>";
	    }
	    else {
			return alg+"<td></td></tr>";
	    }
	}
	else {
		return undefined;
	}
}

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#temperature').html(p.temperature);
    $('#allergytable').html(p.allergytable);
  };

})(window);
