var TEST_COLLECTION_TABLE_NAME = 'testCollectionTableName';

TestCollectionType = DbObjectType.createSubClass('testCollection',
    [
        'field1',
        'field2'
    ],
    TEST_COLLECTION_TABLE_NAME);

Tinytest.add('Meteor Collection Management - DbObject - _save', function(test) {
    var t = new TestCollectionType({field1:'value1', field2:'value2'});
    t._save();
    test.isTrue(t._id, 'Id must be set after call to _save: ' + t._id);
    var id_value = t._id;
    t._id = 'override';
    test.equal(t._id, id_value, '_id field is not immutable!');
});

Tinytest.add('Meteor Collection Management - DbObject - databaseTable', function(test) {
    test.isTrue(TestCollectionType.databaseTable, 'Meteor collection wasn\'t initialized.');
    test.isTrue(TestCollectionType.databaseTable instanceof Meteor.Collection, 'databaseTable field is not a meteor collection');
    test.isTrue(TestCollectionType.databaseTable.findById, 'findById method wasn\'t defined on databaseTable');

    var t = new TestCollectionType({field1:'value1', field2:'value2'});
    t._save();
    var cursor = TestCollectionType.databaseTable.findById(t._id);
    test.isTrue(cursor, 'Find by id didn\'t return a cursor.');

    var t1 = cursor.fetch()[0];
    test.equal(t1._id, t._id, 'Fetched and requested ids do not match.');
    test.isTrue(t.equals(t1), 'Fetched object doesn\'t equal to saved: ' + t1 );

    test.isTrue(TestCollectionType.databaseTable.findOneById, 'findOneById method wasn\'t defined on databaseTable');
    var t2 = TestCollectionType.databaseTable.findOneById(t._id);
    test.equal(t2._id, t._id, 'Fetched and requested ids do not match.');
    test.isTrue(t.equals(t2), 'Fetched object doesn\'t equal to saved: ' + t2 );
});


Tinytest.add('Meteor Collection Management - DbObject - toJsonValue', function(test) {
//TODO
});

Tinytest.add('Meteor Collection Management - DbObject - fromJsonValue', function(test) {
//TODO
});


TestCollectionTypeComplex = DbObjectType.createSubClass('testCollectionComplex',
    {
        refField : {
            reference: true,
            writable: true
        },
        normalField : null
    },
    'testCollectionTableNameComplex');

Tinytest.add('Meteor Collection Management - DbObject - Reference fields', function(test) {
    test.isTrue(TestCollectionTypeComplex.databaseTable.findOneByRefField, 'Reference field findOneBy selector wasn\'t created.');
    test.isTrue(TestCollectionTypeComplex.databaseTable.findByRefField, 'Reference field findBy selector wasn\'t created.');
    test.isFalse(TestCollectionTypeComplex.databaseTable.findByNormalField, 'Selector for normal field was created!');

    var d = new Date();
    var n = d.getMilliseconds();
    var refValue = 'refValue' + n;
    var normalValue = 'normal' + refValue;

    var t = new TestCollectionTypeComplex();
    t.refField = refValue;
    t.normalField = normalValue;
    t._save();
    var t2 = TestCollectionTypeComplex.databaseTable.findOneByRefField(refValue);
    test.isTrue(t2, 'Value by reference field was not found.');
    test.equal(t2._id, t._id, 'Wrong entry found.');
});