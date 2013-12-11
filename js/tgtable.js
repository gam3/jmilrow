
var bigtable = function(id, uri, mod, total_rows) {
  divEl = this._divEl = document.getElementById(id);
  this._table = divEl.getElementsByTagName('table')[0];
  this._headersEl = divEl.getElementsByTagName('thead')[0];
  this._bodyEl    = divEl.getElementsByTagName('tbody')[0];
  this._rows = rows = this._bodyEl.getElementsByTagName('tr');
  topEl = this._topEl = rows[0];
  bottomEl = this._bottomEl = rows[rows.length - 1];
  row_height = Math.floor(this._bodyEl.offsetHeight / (rows.length - 2))
  control = this.control = new Object();
  control.id = id;
  control.base_uri = uri;
  control.mod = mod;
  control.total_rows = total_rows;
  control.view_port = parseInt($('#'+ id).css('height'));
  control.row_height = row_height;
  control.table_rows = rows.length - 2; 
  control.num_real_rows = control.max_real_rows = num_real_rows = rows.length - 2;
  control.real_table_height = num_real_rows * row_height;
  control.top_offset = 0;
  control.top_row = 1;
  control.view_port_rows = Math.floor(control.view_port / 22 )
  control.top_size = 0;

  var self = this;

  helo = function() {
//    self.resizeTable();
    self.renderVisibleRows()
    return 'ok';
  };
  
  if (0) {
    control.max_fill = (total_rows - num_real_rows) * row_height;
    var bottom_offset = control.max_fill - control.top_offset;

    this._topEl.style.height = control.top_offset + 'px';
    this._bottomEl.style.height =  bottom_offset + 'px';
  } else {
    this.resizeTable(true);
  }
  this.inactivityTime();
  this.createEventHandlers()
}

bigtable.prototype.resizeTable = function(force) {
  var self = this;

  $.ajax({
    url: "/tgtable/cgi-bin/tgdata.cgi",
    success: function(response) {
      control = self.control;
      if (control.total_rows != response.rows || force) {
        $("#div_msg").html(response.rows);
	var bottom_flag = false;
	if (self._divEl.scrollTop + self._divEl.offsetHeight >= self._divEl.scrollHeight && self._divEl.scrollTop != 0) {
	  bottom_flag = true;
	}
	var total_rows = response.rows;
	var real_rows = control.max_real_rows;
	if (real_rows > total_rows) {
	  real_rows = total_rows;
	}
	if (total_rows % control.mod != 0 && real_rows < total_rows) {
          real_rows -= total_rows % control.mod;
	}
	if (real_rows != control.num_real_rows) {
	  rows = self._rows;
	  if (real_rows < control.num_real_rows) {
	    for (var i = 0; i < control.max_real_rows - real_rows; i++) {
	      rows[rows.length - 2 - i ].style.display = 'none';
	    }
	  } else {
	    for (var i = control.num_real_rows; i <= real_rows - 1; i++) {
	      rows[ 1 + i ].style.display = '';
	    }
	  }
	  control.num_real_rows = real_rows;
	}
	control.total_rows = total_rows = response.rows;
	var top_size = (control.top_row * control.row_height) - 2;
	var bottom_size = ((total_rows - real_rows - control.top_row) * control.row_height) - 2;
	if (bottom_size <= 0) {
	  self._bottomEl.style.display = 'none';
	  self._bottomEl.style.height = '0px';
	  bottom_size = 0;
	} else {
	  self._bottomEl.style.display = '';
	  self._bottomEl.style.height =  bottom_size + 'px';
	}
	if (bottom_flag) {
	   self._divEl.scrollTop = self._divEl.scrollHeight;
	} else if (control.top_row + real_rows > total_rows) {
          // this is only a problem if we have gotten to the bottom of the table and can set the bottom flag
	   self._divEl.scrollTop = self._divEl.scrollHeight;
	}
        $("#div_msg").html(bottom_size + ' ' + response.rows);
      } else {
        $("#div_msg").html('bob');
      }
    }
  });
}

bigtable.prototype.renderVisibleRows = function() {
  var control = this.control;
  var self = this;
  var row_height = control.row_height;
  var bottom_flag = false;
  var num_real_rows = control.num_real_rows;

  // get visible pixel coordinates
  var startY = this._divEl.scrollTop;
  var endY = startY + this._divEl.offsetHeight;
  if (endY >= this._divEl.scrollHeight && startY != 0) {
    bottom_flag = true;
  }

  var first_visable_row = Math.round(startY / row_height);
  var buffer_size = Math.round(control.num_real_rows / 3);  // (real rows - view port rows) / 2
  // ADD MOD 

  var top_row = first_visable_row - buffer_size;
  if (top_row < 0) {
    top_row = 0;
  }
  var from_bottom = false

  if (top_row >= control.total_rows - control.max_real_rows) {
    from_bottom = true;
    top_row = control.total_rows - control.max_real_rows;
  }

  if (top_row % control.mod) {
    top_row += top_row % control.mod;
  }
  top_row += 1;

  var bottom_flag = false;
  var startY = this._divEl.scrollTop;
  var endY = startY + this._divEl.offsetHeight;
  if (endY >= this._divEl.scrollHeight && startY != 0) {
    bottom_flag = true;
  }

  num_real_rows = control.num_real_rows;

  control.top_row = top_row;
  var uri = control.base_uri + "?start=" + top_row + "&amp;size=" + num_real_rows;

  $.ajax({
    url: uri,
    dataType: 'json',
    success: function(response) {
      if (response && response['data']) {
	rows = self._rows;
	var darray = response['data'];
	if (darray) {
	  var updated_rows = darray.length;
	  if (updated_rows > 0) {
	    $.each(darray, function( index, value ) {
	      $.each(value, function( j, column ) {
		rows[index + 1].cells[j].innerHTML = column;
	      });
	    });
	  }
	}
	var top_size = ((top_row - 1) * control.row_height) - 2;
	var bottom_size = ((control.total_rows - control.num_real_rows - top_row + 1) * control.row_height) - 2;
	if (bottom_size <= 0) {
	  self._bottomEl.style.display = 'none';
	  self._bottomEl.style.height =  0 + 'px';
	  bottom_size = 0;
	} else {
	  self._bottomEl.style.display = '';
	  self._bottomEl.style.height =  bottom_size + 'px';
	}
	if (top_size <= 0) {
	  self._topEl.style.height = 0 + 'px';
	  self._topEl.style.display = 'none';
	  top_size = 0;
	} else {
	  self._topEl.style.height = top_size + 'px';
	  self._topEl.style.display = '';
	}
	if (bottom_flag) {
	  var startY = self._divEl.scrollTop;
	  var endY = startY + self._divEl.offsetHeight;
	  if (!(endY >= self._divEl.scrollHeight && startY != 0)) {
	    console.log("BOTTOM ERROR");
	  }
	}
	control.top_offset = top_size;
      } else {
	console.log("FAIL");
      }
    }
  });

  return 'OK';
};

bigtable.prototype.createEventHandlers = function() {
  this._curScrollLeft = null;
  this._curScrollTop = null;

  var headersEl = this._headersEl;
  var divEl = this._divEl;

  var self = this;

  $(divEl).scroll( function() {
    // Handle left/right scroll
    var scrollLeft = divEl.scrollLeft;
    if (self._curScrollLeft != scrollLeft) {
      headersEl.scrollLeft = scrollLeft;
      self._curScrollLeft = scrollLeft;
    }

    // Handle up/down scroll
    var scrollTop = divEl.scrollTop;
    if (self._curScrollTop != scrollTop) {
      if (self._verticalScrollHandle != null) {
        clearTimeout(self._verticalScrollHandle);
      }

      self._verticalScrollHandle = setTimeout(function() {
        self.renderVisibleRows();
      }, 200);
      self._curScrollTop = scrollTop;
    }
  });
};

bigtable.prototype.inactivityTime = function () {
  var self = this;

  var resetTimer = function() {
    var logout = function() {
      self.resizeTable();
      self._t = setTimeout(logout, 3000)
    }

    if (self._t) {
      clearTimeout(self._t);
    }
    self._t = setTimeout(logout, 3000)
    // 1000 milisec = 1 sec
  }
  window.onload = resetTimer;
  document.onmousemove = resetTimer;
  document.onkeypress = resetTimer;
};
