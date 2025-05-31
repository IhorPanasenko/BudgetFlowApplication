import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import ModalWrapper from "@/components/ModalWrapper";
import { colors, spacingY } from "@/contansts/theme";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const ICON_NAMES = Object.keys(Icons).filter(
  (name) => typeof Icons[name as keyof typeof Icons] === "function"
);

export const IconPickerModal = () => {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filteredIcons = useMemo(() => {
    return ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const rows = [];
  for (let i = 0; i < filteredIcons.length; i += 2) {
    rows.push(filteredIcons.slice(i, i + 2));
  }

    const handleSelect = (iconName: string) => {
    router.replace({
        pathname: "/(modals)/categoryModal",
        params: { selectedIcon: iconName },
    });
    };

  return (
    <ModalWrapper>
      <Header
        title="Icons List"
        leftIcon={<BackButton />}
        style={{ marginBottom: spacingY._10 }}
      />
      <View style={styles.modalContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search icon..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.neutral400}
        />
        <FlatList
          data={rows}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.map((iconName) => {
                const IconComponent = Icons[iconName as keyof typeof Icons];
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={styles.iconBox}
                    onPress={() => handleSelect(iconName)}
                  >
                    <IconComponent size={28} color={colors.primary} />
                    <Text style={styles.iconLabel}>{iconName}</Text>
                  </TouchableOpacity>
                );
              })}
              {row.length < 2 && <View style={styles.iconBox} />}
            </View>
          )}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
        />
      </View>
    </ModalWrapper>
  );
};

export default IconPickerModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral900,
    padding: 16,
    paddingTop: 40,
  },
  searchInput: {
    backgroundColor: colors.neutral800,
    color: colors.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  iconBox: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    marginHorizontal: 4,
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    minHeight: 60,
    justifyContent: "center",
  },
  iconLabel: {
    color: colors.neutral200,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 16,
    alignSelf: "center",
    padding: 10,
  },
});
