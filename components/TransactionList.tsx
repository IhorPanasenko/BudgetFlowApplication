import { colors, radius, spacingX, spacingY } from "@/contansts/theme";
import { useAuth } from "@/context/authContext";
import { useCategories } from "@/hooks/useCategories";
import {
  TransactionItemProps,
  TransactionListType,
  TransactionType,
} from "@/types";
import { verticalScale } from "@/utilts/styling";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import * as Icons from 'phosphor-react-native';
import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Loading from "./Loading";
import Typo from "./Typo";

const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
}: TransactionListType) => {
  const { user } = useAuth();
  const router = useRouter();

  const { categories, loading: categoriesLoading } = useCategories(user?.uid);

  const transactionsWithCategory = useMemo(() => {
    if (!categories.length) return [];
    return data.map((tx) => ({
      ...tx,
      category: categories.find((cat) => cat.id === tx.categoryId),
    }));
  }, [data, categories]);

  const handleClick = (item: TransactionType) => {
    router.push({
      pathname: "/(modals)/transactionModal",
      params: {
        id: item?.id,
        type: item?.type,
        amount: item?.amount.toString(),
        categoryId: item?.categoryId,
        date: (item?.date as Timestamp)?.toDate().toISOString(),
        description: item?.description,
        uid: item?.uid,
        walletId: item?.walletId,
        image: item?.image,
      },
    });
  };
  return (
    <View style={styles.container}>
      {title && (
        <Typo size={20} fontWeight={"500"}>
          {title}
        </Typo>
      )}
      <View style={styles.list}>
        <FlashList
          data={transactionsWithCategory}
          renderItem={({ item, index }) => (
            <TransactionItem
              item={item}
              index={index}
              handleClick={handleClick}
            />
          )}
          estimatedItemSize={200}
        />
      </View>
      {!loading && data.length === 0 && (
        <Typo
          size={15}
          color={colors.neutral400}
          style={{ textAlign: "center", marginTop: spacingY._15 }}
        >
          {emptyListMessage || "The list is empty"}
        </Typo>
      )}

      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <Loading />
        </View>
      )}
    </View>
  );
};

const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {

  const category = item.category;
  const IconComponent =
    category && typeof Icons[category.icon as keyof typeof Icons] === "function"
      ? Icons[category.icon as keyof typeof Icons]
      : Icons.Question;
  const bgColor = category?.bgColor || colors.neutral800;
  const label = category?.label || "Unknown";
  const type = category?.type || "Expense";

  const date = (item?.date as Timestamp)
    ?.toDate()
    ?.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100)
        .springify()
        .damping(14)}
    >
      <TouchableOpacity style={styles.row} onPress={() => handleClick(item)}>
        <View style={[styles.icon, { backgroundColor: bgColor }]}>
          {IconComponent && typeof IconComponent === "function" && (
            <IconComponent
              size={verticalScale(25)}
              weight="fill"
              color={colors.white}
            />
          )}
        </View>
        <View style={styles.categoryDes}>
          <Typo size={17} fontWeight={"500"}>
            {label}
          </Typo>
          <Typo
            size={12}
            color={colors.neutral400}
            textProps={{ numberOfLines: 1 }}
          >
            {item?.description || "No description"}
          </Typo>
        </View>

        <View style={styles.amountDate}>
          <Typo
            size={17}
            fontWeight={"500"}
            color={type.toLowerCase() === "income" ? colors.primary : colors.rose}
          >
            {`${type.toLowerCase() === "income" ? "+ $" : "- $"}${item.amount}`}
          </Typo>
          <Typo size={14} color={colors.neutral400}>
            {date}
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TransactionList;

const styles = StyleSheet.create({
  container: {
    gap: spacingY._15,
  },
  list: {
    minHeight: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacingX._12,
    marginBottom: spacingY._12,
    backgroundColor: colors.neutral800,
    padding: spacingY._10,
    paddingHorizontal: spacingY._10,
    borderRadius: radius._17,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous",
  },
  categoryDes: {
    flex: 1,
    gap: 2.5,
  },
  amountDate: {
    alignItems: "flex-end",
    gap: 3,
  },
});
